import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import moment from 'moment';
import cors from 'cors';
import 'dotenv/config';
import admin from 'firebase-admin';
import path from 'path';                       // 👈 importa path
import { fileURLToPath } from 'url';           // para recrear __dirname

const app = express();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();
const histoCol = db.collection('historial');


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPath = path.join(__dirname, '../frontend/build');
const cropsPath = path.join(__dirname, './crops.json');

app.use(cors());
app.use(express.json());  

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('Insumero API funcionando 🧪');
});

const productosFOB = {
  "10011900129F": "trigo",
  "10059000090H": "trigo",
  "12010000900H": "soja",
  "10011900229L": "trigo",

};

app.get("/api/fob", async (req, res) => {
  try {
    console.log("Obteniendo precios FOB...");
    const today = moment().format("DD/MM/YYYY");
    const data = await withCache('fob_precios', (CACHE_MIN > 0 ? CACHE_MIN : 60) * 60 * 1000, async () => {
      const response = await fetch(`https://monitorsiogranos.magyp.gob.ar/ws/ssma/precios_fob.php?Fecha=${today}`);
      const text = await response.text();
      const parsed = JSON.parse(text);

      const precios = {};
      parsed.posts.forEach(entry => {
        const nombre = productosFOB[entry.posicion];
        if (nombre && !precios[nombre]) {
          precios[nombre] = entry.precio;
        }
      });
      return precios;
    });

    res.json(data);
  } catch (err) {
    console.error("Error al obtener precios FOB:", err);
    res.status(500).json({ error: "No se pudieron obtener precios FOB" });
  } 
});

// Exponer cultivos y requerimientos (desde crops.json)
app.get('/api/cultivos', (_req, res) => {
  try {
    const raw = fs.readFileSync(cropsPath, 'utf8');
    const json = JSON.parse(raw);
    res.json(json);
  } catch (e) {
    console.error('Error leyendo crops.json', e);
    res.status(500).json({ error: 'No se pudieron leer los cultivos' });
  }
});

// Calcular margen por hectárea: { cultivo, rendimiento_t_ha, precio_usd_ton }
app.post('/api/margen', (req, res) => {
  try {
    const { cultivo, rendimiento_t_ha, precio_usd_ton } = req.body || {};
    if (!cultivo || typeof rendimiento_t_ha !== 'number' || typeof precio_usd_ton !== 'number') {
      return res.status(400).json({
        error: 'Parámetros inválidos. Esperado cultivo, rendimiento_t_ha (number), precio_usd_ton (number)'
      });
    }

    const raw = fs.readFileSync(cropsPath, 'utf8');
    const crops = JSON.parse(raw);
    const info = crops[cultivo];
    if (!info) return res.status(404).json({ error: `Cultivo no encontrado: ${cultivo}` });

    const ingreso_usd_ha = +(rendimiento_t_ha * precio_usd_ton).toFixed(2);
    const costo_usd_ha = Number(info.costPerHa) || 0;
    const margen_usd_ha = +(ingreso_usd_ha - costo_usd_ha).toFixed(2);

    res.json({
      cultivo,
      rendimiento_t_ha,
      precio_usd_ton,
      ingreso_usd_ha,
      costo_usd_ha,
      margen_usd_ha
    });
  } catch (e) {
    console.error('Error calculando margen', e);
    res.status(500).json({ error: 'No se pudo calcular el margen' });
  }
});

/* POST /api/historial */
app.post('/api/historial', async (req, res) => {
    console.log('>> BODY RECIBIDO:', req.body);   // 👈 añade esto

  try {
    await histoCol.add({ ...req.body, fecha: new Date() });
    res.status(201).json({ message: 'Guardado en Firestore ✅' });
  } catch (e) {
    console.error('Firestore error', e);
    res.status(500).json({ error: 'No se pudo guardar' });
  }
});

/* GET /api/historial */
app.get('/api/historial', async (req, res) => {

  try {
    const snap = await histoCol.orderBy('fecha', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    console.error('Firestore error', e);
    res.status(500).json({ error: 'No se pudo leer historial' });
  }
});

/* ── precios internacionales gratis (IndexMundi) ── */

// Símbolos CBOT en Yahoo
const YH = { soja:'ZS=F', maiz:'ZC=F', trigo:'ZW=F' };

const getPrice = async sym => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1d&interval=1d`;
  const json = await fetch(url).then(r => r.json());
  return json.chart.result[0].meta.regularMarketPrice;   // USD/bu
};

// bushel → tonelada
const FACTOR = { soja:27.216, maiz:39.368, trigo:36.744 };

// Cache simple en memoria
const CACHE = new Map(); // key -> { t:number, data:any }
const CACHE_MIN = Number(process.env.CACHE_MIN || 0);
const withCache = async (key, ttlMs, producer) => {
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < ttlMs) return hit.data;
  const data = await producer();
  CACHE.set(key, { t: now, data });
  return data;
};

app.get('/api/precios', async (_req, res) => {
  try {
    const data = await withCache('precios_usd_ton', (CACHE_MIN > 0 ? CACHE_MIN : 5) * 60 * 1000, async () => {
      const entries = await Promise.all(
        Object.entries(YH).map(async ([k, sym]) => {
          const bu = await getPrice(sym);
          return [k, +(bu * FACTOR[k]).toFixed(2)];      // USD/ton
        })
      );
      return Object.fromEntries(entries);            // { soja, maiz, trigo }
    });
    res.json(data);
  } catch (e) {
    console.error('Yahoo error', e.message);
    res.status(500).json({ error:'Precios no disponibles' });
  }
});

// --- Historia de precios: /api/precios/hist?commodity=soja&days=7 ---
// symbols Yahoo
const YSYM = { soja: 'ZS=F', maiz: 'ZC=F', trigo: 'ZW=F' };
// bushel → tonelada
const TON = { soja: 27.216, maiz: 39.368, trigo: 36.744 };

app.get('/api/precios/hist', async (req, res) => {
  try {
    const commodity = (req.query.commodity || 'soja').toLowerCase();
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 7));
    const sym = YSYM[commodity];
    if (!sym) return res.status(400).json({ error: 'commodity inválido' });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=${days}d&interval=1d`;
    const json = await fetch(url).then(r => r.json());
    const r = json?.chart?.result?.[0];
    if (!r) return res.status(502).json({ error: 'Yahoo sin datos' });

    const ts = r.timestamp; // epoch seconds[]
    const closes = r.indicators?.quote?.[0]?.close || [];
    const factor = TON[commodity];

    const series = ts.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      usdTon: closes[i] != null ? +(closes[i] * factor).toFixed(2) : null,
    })).filter(p => p.usdTon != null);

    res.json({ commodity, days, series });
  } catch (e) {
    console.error('hist precios', e);
    res.status(500).json({ error: 'No se pudo obtener historial' });
  }
});

// ── Servir frontend ──
app.use(express.static(buildPath));

app.get('*', (_req, res) =>
  res.sendFile(path.join(buildPath, 'index.html'))
);

// ── Arrancar servidor ──
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Insumero API 🔥 escuchando en ${PORT}`));

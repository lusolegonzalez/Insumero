import express from 'express';
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
const __dirname  = path.dirname(__filename);   // ahora funciona

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
);

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
    const response = await fetch(`https://monitorsiogranos.magyp.gob.ar/ws/ssma/precios_fob.php?Fecha=27/06/2025`);
    const text = await response.text();
    const data = JSON.parse(text);

    const precios = {};

    data.posts.forEach(entry => {
      const nombre = productosFOB[entry.posicion];
      if (nombre && !precios[nombre]) {
        precios[nombre] = entry.precio;
      }
    });

    res.json(precios);
  } catch (err) {
    console.error("Error al obtener precios FOB:", err);
    res.status(500).json({ error: "No se pudieron obtener precios FOB" });
  }
});


// Arrancar servidor
app.listen(3001, () => console.log('Insumero API con Firestore 🔥 listo'));


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

app.get('/api/precios', async (_req, res) => {
  try {
    const entries = await Promise.all(
      Object.entries(YH).map(async ([k,sym]) => {
        const bu = await getPrice(sym);
        return [k, +(bu * FACTOR[k]).toFixed(2)];      // USD/ton
      })
    );
    res.json(Object.fromEntries(entries));            // { soja, maiz, trigo }
  } catch (e) {
    console.error('Yahoo error', e.message);
    res.status(500).json({ error:'Precios no disponibles' });
  }
});
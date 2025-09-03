import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatAnyDate } from "../utils/dates";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";
const OW_KEY = "b41a4b24fe6bf359a7823cf321cd9ba5";
const FALLBACK = { lat: -36.78, lon: -59.86, name: "Azul" };

function Card({ title, children, right }) {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <h6 className="text-muted m-0">{title}</h6>
            {right}
          </div>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [precios, setPrecios] = useState(null);
  const [ultimo, setUltimo] = useState(null);
  const [clima, setClima] = useState(null);
  const [coords, setCoords] = useState(FALLBACK);
  const [serieSoja, setSerieSoja] = useState(null);

  // precios del día
  useEffect(() => {
    fetch(`${API}/api/precios`).then(r => r.json()).then(setPrecios).catch(() => setPrecios(null));
  }, []);

  // último cálculo
  useEffect(() => {
    fetch(`${API}/api/historial`).then(r => r.json()).then(items => setUltimo(items?.[0] || null)).catch(() => setUltimo(null));
  }, []);

  // clima
  useEffect(() => {
    const load = async (lat, lon) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&lang=es&units=metric&appid=${OW_KEY}`;
      const j = await fetch(url).then(r => r.json());
      setClima(j);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: c }) => { setCoords({ lat: c.latitude, lon: c.longitude, name: "Tu ubicación" }); load(c.latitude, c.longitude); },
        () => load(FALLBACK.lat, FALLBACK.lon)
      );
    } else {
      load(FALLBACK.lat, FALLBACK.lon);
    }
  }, []);

  // historial soja 7 días
  useEffect(() => {
    fetch(`${API}/api/precios/hist?commodity=soja&days=7`)
      .then(r => r.json())
      .then(d => setSerieSoja(d.series || []))
      .catch(() => setSerieSoja(null));
  }, []);

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-success">📊 Dashboard</h3>

      <div className="row">
        {/* Clima */}
        <Card title={`Clima — ${coords.name}`} right={<span className="badge bg-info">OpenWeather</span>}>
          {!clima ? <div className="text-muted">Cargando…</div> : (
            <>
              <div className="display-6 fw-semibold">{Math.round(clima.main.temp)}°C</div>
              <div className="text-muted">{clima.weather?.[0]?.description} · Hum: {clima.main.humidity}%</div>
            </>
          )}
        </Card>

        {/* Precios internacionales */}
        <Card title="Precios internacionales (USD/ton)" right={<span className="badge bg-secondary">Yahoo</span>}>
          {!precios ? <div className="text-muted">Cargando…</div> : (
            <ul className="list-unstyled m-0">
              <li>🌱 Soja: <strong>{precios.soja ?? "—"}</strong></li>
              <li>🌽 Maíz: <strong>{precios.maiz ?? "—"}</strong></li>
              <li>🌾 Trigo: <strong>{precios.trigo ?? "—"}</strong></li>
            </ul>
          )}
        </Card>

        {/* Último cálculo (con fecha corregida) */}
        <Card title="Último cálculo" right={<a className="btn btn-sm btn-outline-success" href="/historial">Ver historial</a>}>
          {!ultimo ? <div className="text-muted">Todavía no hay cálculos</div> : (
            <ul className="list-unstyled m-0">
              <li><strong>Cultivo:</strong> {ultimo.cultivo}</li>
              <li><strong>Hectáreas:</strong> {ultimo.hectareas}</li>
              <li><strong>Costo:</strong> ${ultimo.resultado?.cost?.toLocaleString()}</li>
              <li className="text-muted small">{formatAnyDate(ultimo.fecha)}</li>
            </ul>
          )}
        </Card>

        {/* Sparkline soja 7 días */}
     <div className="col-12 col-xl-6">
  <div className="card shadow-sm border-0 mb-3">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start">
        <h6 className="text-muted m-0">Soja — últimos 7 días (USD/ton)</h6>

        {/* RIGHT: variación vs. día anterior */}
        {serieSoja && serieSoja.length > 1 ? (() => {
          const last = serieSoja[serieSoja.length - 1].usdTon;
          const prev = serieSoja[serieSoja.length - 2].usdTon;
          const diff = +(last - prev).toFixed(2);
          const up = diff >= 0;
          return (
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${up ? 'bg-success' : 'bg-danger'}`}>
                {up ? '↑' : '↓'} {Math.abs(diff)}
              </span>
              <span className="badge bg-secondary">Yahoo</span>
            </div>
          );
        })() : (
          <span className="badge bg-secondary">Yahoo</span>
        )}
      </div>

      <div style={{ width: '100%', height: 220 }}>
        {!serieSoja ? (
          <div className="text-muted mt-3">Cargando…</div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={serieSoja} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['dataMin', 'dataMax']} width={60} />
              <Tooltip />
              <Line type="monotone" dataKey="usdTon" stroke="#28a745" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}
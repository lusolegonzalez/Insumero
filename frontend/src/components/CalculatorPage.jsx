import { useState } from "react";
import { crops } from "../data/crops";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import 'bootstrap/dist/css/bootstrap.min.css';
import { saveToHistory } from '../utils/saveToHistory';

const COLORS = ["#2e7d32", "#f9a825", "#6d4c41"];

export function CalculatorPage() {
  const [cropKey,setCropKey]=useState('soja');
  const [ha,setHa]=useState(1);
  const [result, setRes] = useState(null);
  const [marketPrices, setMarketPrices] = useState(null);
  const [fobPrices, setFobPrices] = useState(null);

  const calculate=()=>{
    const c=crops[cropKey];
    const result={
      seed : c.seed.value*ha,
      urea : c.urea.value*ha,
      fosfato : c.fosfato.value*ha,
      cost : c.costPerHa*ha,
      unit : c.seed.unit
    };
    setRes(result);
    console.log("Resultado:", result);
    saveToHistory({cultivo:cropKey,hectareas:ha,resultado:result});
  };

  // const fetchPrices = async () => {
  //   try {
  //     const res = await fetch("http://localhost:3001/api/prices");
  //     const data = await res.json();
  //     setMarketPrices(data);
  //   } catch (err) {
  //     console.error("Error al obtener precios de mercado", err);
  //   }
  // };

  const fetchIntl = async () => {
    try {
      const res  = await fetch('http://localhost:3001/api/precios');
      const data = await res.json();           // { soja, maiz, trigo }
      setMarketPrices(data);
    } catch (e) { console.error(e); }
  }

  const fetchFob = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/fob");
      const data = await res.json();
      setFobPrices(data);
    } catch (err) {
      console.error("Error al obtener precios FOB", err);
    }
  };

  const chartData = result
    ? [
        { name: "Semilla", value: result.seed },
        { name: "Urea", value: result.urea },
        { name: "Fosfato", value: result.fosfato },
      ]
    : [];

  return (
    
    <div className="container py-5">
      {/* <WeatherWidget /> */}

      <div className="bg-light rounded p-4 shadow">
        <h1 className="mb-4 text-success text-center">🌱 Insumero</h1>

        <div className="row g-3 align-items-center mb-4 justify-content-center">
          <div className="col-auto">
            <label htmlFor="cultivo" className="col-form-label fw-bold">Cultivo</label>
          </div>
          <div className="col-auto">
            <select id="cultivo" className="form-select" value={cropKey} onChange={e => setCropKey(e.target.value)}>
              {Object.keys(crops).map(key => (
                <option key={key} value={key}>{crops[key].name}</option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <label htmlFor="hectareas" className="col-form-label fw-bold">Hectáreas</label>
          </div>
          <div className="col-auto">
            <input type="number" className="form-control" id="hectareas" value={ha} onChange={e => setHa(Number(e.target.value))} />
          </div>

          <div className="col-auto">
            <button className="btn btn-success" onClick={calculate}>Calcular</button>
          </div>

          <div className="col-auto">
            <button className="btn btn-outline-secondary" onClick={fetchIntl}>🔄 Ver precios internacionales</button>
          </div>

          <div className="col-auto">
            <button className="btn btn-outline-warning" onClick={fetchFob}>🌾 Ver precios FOB Argentina</button>
          </div>
        </div>

        {result && (
          <div className="card shadow p-4 mt-4 border-0">
            <h4 className="mb-3">Resultado</h4>
            <div className="row">
              <div className="col-md-6">
                <ul className="list-group">
                  <li className="list-group-item">🌾 Semilla: {result.seed} {result.unit}</li>
                  <li className="list-group-item">🧪 Urea: {result.urea} kg</li>
                  <li className="list-group-item">🧱 Fosfato: {result.fosfato} kg</li>
                  <li className="list-group-item fw-bold">💰 Costo estimado: ${result.cost.toLocaleString()}</li>
                </ul>

                {marketPrices && (
                  <div className="mt-4">
                    <h6 className="fw-bold">🌎 Precios de mercado actuales:</h6>
                    <ul>
                      <li>Soja: USD {marketPrices.soja}</li>
                      <li>Trigo: USD {marketPrices.trigo}</li>
                      <li>Maíz: USD {marketPrices.maiz}</li>
                    </ul>
                  </div>
                )}

                {fobPrices && (
                  <div className="mt-4">
                    <h6 className="fw-bold">🇦🇷 Precios FOB (exportación - Argentina):</h6>
                    <ul>
                      <li>Soja: {fobPrices.soja || "No disponible"}</li>
                      <li>Trigo: {fobPrices.trigo || "No disponible"}</li>
                      <li>Maíz: {fobPrices.maiz || "No disponible"}</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <div style={{ width: "100%", height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
  

      </div>
    </div>
  );
}
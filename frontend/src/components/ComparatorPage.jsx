import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { crops } from "../data/crops";

// 1️⃣ Componente «página» que permite elegir y pasa las keys
export function ComparatorPage() {
  const [cropA, setCropA] = useState("soja");
  const [cropB, setCropB] = useState("trigo");
  const [hectares, setHectares] = useState(1);

  return (
    <div className="card p-4 shadow border-0">
      <h3 className="mb-4 text-success">🔄 Comparar cultivos</h3>

      <div className="row g-3 mb-4">
        <div className="col">
          <label className="form-label">Cultivo A</label>
          <select className="form-select" value={cropA} onChange={e => setCropA(e.target.value)}>
            {Object.keys(crops).map(k => <option key={k} value={k}>{crops[k].name}</option>)}
          </select>
        </div>

        <div className="col">
          <label className="form-label">Cultivo B</label>
          <select className="form-select" value={cropB} onChange={e => setCropB(e.target.value)}>
            {Object.keys(crops).map(k => <option key={k} value={k}>{crops[k].name}</option>)}
          </select>
        </div>

        <div className="col-3">
          <label className="form-label">Hectáreas</label>
          <input type="number" className="form-control" value={hectares} min="1"
                 onChange={e => setHectares(Number(e.target.value))} />
        </div>
      </div>

      <CropComparator crop1Key={cropA} crop2Key={cropB} hectares={hectares} />
    </div>
  );
}

/* 2️⃣ Componente gráfico puro */
function CropComparator({ crop1Key, crop2Key, hectares }) {
  const c1 = crops[crop1Key];
  const c2 = crops[crop2Key];

  const data = [
    { name: "Semilla", [c1.name]: c1.seed.value * hectares, [c2.name]: c2.seed.value * hectares },
    { name: "Urea",    [c1.name]: c1.urea.value * hectares, [c2.name]: c2.urea.value * hectares },
    { name: "Fosfato", [c1.name]: c1.fosfato.value * hectares, [c2.name]: c2.fosfato.value * hectares },
    { name: "Costo",   [c1.name]: c1.costPerHa * hectares, [c2.name]: c2.costPerHa * hectares },
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={c1.name} fill="#66bb6a" />
        <Bar dataKey={c2.name} fill="#ffb74d" />
      </BarChart>
    </ResponsiveContainer>
  );
}
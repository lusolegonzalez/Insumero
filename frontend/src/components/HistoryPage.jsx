import { useEffect, useState } from 'react';
export function HistoryPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch('http://localhost:3001/api/historial').then(r => r.json()).then(setItems);
  }, []);
  if (!items.length) return <p className="text-muted">(No hay cálculos en el historial aún)</p>;
  return (
    <div className="card p-4 shadow border-0">
      <h4 className="text-primary mb-3">📜 Historial de cálculos</h4>
      <table className="table table-sm">
        <thead><tr><th>Fecha</th><th>Cultivo</th><th>Ha</th><th>Semilla</th><th>Urea</th><th>Fosfato</th><th>Costo</th></tr></thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{new Date(it.fecha).toLocaleString()}</td>
              <td>{it.cultivo}</td><td>{it.hectareas}</td>
              <td>{it.resultado?.seed}</td>
              <td>{it.resultado?.urea}</td>
              <td>{it.resultado?.fosfato}</td>
              <td>${it.resultado?.cost.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
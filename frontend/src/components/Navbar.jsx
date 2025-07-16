import { Link, NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success mb-4 shadow">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">🌱 Insumero</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/calculadora">Calculadora</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/comparador">Comparador</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/clima">Clima</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/historial">Historial</NavLink></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
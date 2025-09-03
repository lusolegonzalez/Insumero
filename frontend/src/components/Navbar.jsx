import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function Navbar({ theme: themeProp, onToggleTheme: onToggleThemeProp }) {
  const [theme, setTheme] = useState(() => {
    if (themeProp) return themeProp;
    try {
      return document.documentElement.getAttribute('data-bs-theme') || localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    if (themeProp && themeProp !== theme) setTheme(themeProp);
  }, [themeProp]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    if (onToggleThemeProp) {
      onToggleThemeProp();
    } else {
      document.documentElement.setAttribute('data-bs-theme', next);
      try { localStorage.setItem('theme', next); } catch {}
    }
    setTheme(next);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success mb-4 shadow">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">🌱 Insumero</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li><NavLink className="nav-link" to="/">Inicio</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/calculadora">Calculadora</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/comparador">Comparador</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/clima">Clima</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/historial">Historial</NavLink></li>
          </ul>
          <div className="d-flex ms-lg-3 mt-3 mt-lg-0">
            <button
              type="button"
              className={theme === 'dark' ? 'btn btn-outline-light btn-sm' : 'btn btn-outline-secondary btn-sm'}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

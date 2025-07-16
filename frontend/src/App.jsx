import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CalculatorPage } from './components/CalculatorPage';
import { ComparatorPage } from './components/ComparatorPage';
import { WeatherWidget } from './components/WeatherWidget';
import { HistoryPage } from './components/HistoryPage';
import { Navbar } from './components/Navbar';

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="container pb-5">
        <Routes>
          <Route path="/" element={<Navigate to="/calculadora" />} />
          <Route path="/calculadora" element={<CalculatorPage />} />
          <Route path="/comparador" element={<ComparatorPage />} />
          <Route path="/clima" element={<WeatherWidget />} />
          <Route path="/historial" element={<HistoryPage />} />
        </Routes>
      </div>
    </div>
  );
}

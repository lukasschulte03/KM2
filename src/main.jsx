import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.jsx'
import Infektion from './pages/Infektion.jsx'
import KM1 from "./pages/KM1.jsx";
import Oversikt from "./pages/Oversikt.jsx";
import Hud from "./pages/Hud.jsx";


createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App />} />
			<Route path="/infektion" element={<Infektion />} />
			<Route path="/km1" element={<KM1 />} />
			<Route path="/oversikt" element={<Oversikt />} />
			<Route path="/hud" element={<Hud />} />
		</Routes>
	</BrowserRouter>,
);

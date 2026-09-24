import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Historial Médico Dra. Oca &middot; Sistema de Gestión Clínica &middot; Acceso Seguro
      </footer>
    </div>
  );
}

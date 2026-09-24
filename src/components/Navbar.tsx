import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSignOut } from "@/hooks/useSignOut";
import { FaUserDoctor, FaArrowRightFromBracket } from "react-icons/fa6";
import { HiUserGroup } from "react-icons/hi2";

export default function Navbar() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const location = useLocation();

  const isPatientsActive = location.pathname.startsWith("/patients");

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/patients" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <FaUserDoctor className="text-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Dra. Oca
                </span>
                <span className="text-xs font-medium text-slate-500 -mt-0.5">
                  Historial Clínico
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/patients"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPatientsActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <HiUserGroup className="text-base" />
                Pacientes
              </Link>
            </nav>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            {user?.email && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[200px] truncate" title={user.email}>
                  {user.email}
                </span>
              </div>
            )}

            <button
              onClick={() => {
                if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
                  signOut.mutate();
                }
              }}
              disabled={signOut.isPending}
              title="Cerrar sesión"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FaArrowRightFromBracket className="text-sm" />
              <span className="hidden sm:inline">
                {signOut.isPending ? "Cerrando..." : "Salir"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

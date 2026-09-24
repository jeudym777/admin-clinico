import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaUserDoctor, FaShieldHeart, FaFileMedical, FaUserCheck } from "react-icons/fa6";
import { HiEnvelope, HiLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState } = useForm<LoginForm>({
    mode: "onChange",
  });

  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message || "Credenciales incorrectas");
    } else {
      toast.success("¡Bienvenida Dra. Oca!");
      navigate("/patients");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-teal-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Lado izquierdo: Banner Visual */}
        <div className="relative hidden md:flex flex-col justify-between p-8 text-white overflow-hidden bg-slate-900">
          {/* Imagen de fondo con overlay */}
          <img
            src="/login-banner.jpg"
            alt="Consultorio Médico Dra. Oca"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-950/70 to-teal-900/60" />

          {/* Contenido sobre la imagen */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide uppercase text-teal-200 mb-6">
              <FaShieldHeart className="text-sm text-teal-300" />
              Sistema Clínico Seguro
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Historial Médico <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-300">
                Dra. Oca
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Control integral de pacientes, historial clínico por sistemas y generación de reportes médicos con la máxima confidencialidad.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3 pt-6 border-t border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <FaUserCheck className="text-xs" />
              </div>
              <span>Directorio y ficha completa de pacientes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <FaFileMedical className="text-xs" />
              </div>
              <span>Expediente clínico en 12 secciones estructuradas</span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Formulario de Login */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4">
              <FaUserDoctor className="text-xl" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa tus credenciales para acceder a los expedientes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-5">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HiEnvelope className="text-lg" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="doctora@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  {...register("email", { required: true })}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HiLockClosed className="text-lg" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  {...register("password", { required: true })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Botón Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !formState.isValid}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  "Ingresar al Consultorio"
                )}
              </button>
            </div>

            {/* Enlace al registro */}
            <div className="text-center pt-3 text-xs text-slate-500">
              ¿No tienes una cuenta aún?{" "}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                Registrarse aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

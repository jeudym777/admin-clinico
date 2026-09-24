import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaUserDoctor, FaShieldHeart, FaNotesMedical, FaClockRotateLeft } from "react-icons/fa6";
import { HiEnvelope, HiLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState, setError } = useForm<RegisterForm>({
    mode: "onChange",
  });

  const onRegisterSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", { type: "manual", message: "Las contraseñas no coinciden" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin + "/login",
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registro exitoso. Revisa tu correo o inicia sesión con tus datos.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-teal-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Lado izquierdo: Banner Visual */}
        <div className="relative hidden md:flex flex-col justify-between p-8 text-white overflow-hidden bg-slate-900">
          <img
            src="/login-banner.jpg"
            alt="Consultorio Dra. Oca"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-950/70 to-teal-900/60" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide uppercase text-teal-200 mb-6">
              <FaShieldHeart className="text-sm text-teal-300" />
              Registro Exclusivo
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Únete a la plataforma <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-300">
                Dra. Oca
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Crea tu cuenta profesional para gestionar expedientes clínicos con respaldo en la nube y total seguridad.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3 pt-6 border-t border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <FaNotesMedical className="text-xs" />
              </div>
              <span>Plantillas clínicas especializadas e IMC automático</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <FaClockRotateLeft className="text-xs" />
              </div>
              <span>Exportación instantánea en PDF para el paciente</span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Formulario de Registro */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4">
              <FaUserDoctor className="text-xl" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Crear Cuenta
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Completa los datos para registrar un nuevo usuario médico.
            </p>
          </div>

          <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  {...register("email", { required: true })}
                />
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HiLockClosed className="text-lg" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
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

            {/* Campo Confirmar Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HiLockClosed className="text-lg" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  {...register("confirmPassword", { required: true })}
                />
              </div>
              {formState.errors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Botón Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !formState.isValid}
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Registrando..." : "Registrar Cuenta"}
              </button>
            </div>

            {/* Enlace al Login */}
            <div className="text-center pt-2 text-xs text-slate-500">
              ¿Ya tienes una cuenta registrada?{" "}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

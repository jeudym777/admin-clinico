import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaShieldHeart, FaLock, FaCheckDouble } from "react-icons/fa6";
import { HiLockClosed, HiEye, HiEyeSlash, HiArrowLeft } from "react-icons/hi2";

type ResetPasswordForm = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState, watch, setError } = useForm<ResetPasswordForm>({
    mode: "onChange",
  });

  const passwordValue = watch("password");

  useEffect(() => {
    // Escuchar el evento de recuperación de contraseña de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        toast.info("Sesión de recuperación detectada. Ingresa tu nueva contraseña.");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const onResetSubmit = async (data: ResetPasswordForm) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Las contraseñas no coinciden",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error(error.message || "Error al actualizar la contraseña.");
    } else {
      setIsSuccess(true);
      toast.success("¡Tu contraseña ha sido actualizada con éxito!");
      // Esperar 2 segundos antes de redirigir al login
      setTimeout(() => {
        navigate("/login");
      }, 2500);
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
              Seguridad de Acceso
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Actualizar Clave <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-300">
                Dra. Oca
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Define una nueva contraseña segura para salvaguardar el acceso a los expedientes y consultas clínicas.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3 pt-6 border-t border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <FaLock className="text-xs" />
              </div>
              <span>Mínimo 6 caracteres recomendados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <FaCheckDouble className="text-xs" />
              </div>
              <span>Cifrado y protección bajo protocolo Supabase</span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Formulario */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4">
                  <FaLock className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Nueva Contraseña
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Escribe y confirma tu nueva contraseña para ingresar al sistema.
                </p>
              </div>

              <form onSubmit={handleSubmit(onResetSubmit)} className="space-y-4">
                {/* Campo Nueva Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <HiLockClosed className="text-lg" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                      {...register("password", {
                        required: "La contraseña es requerida",
                        minLength: {
                          value: 6,
                          message: "Debe contener al menos 6 caracteres",
                        },
                      })}
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
                  {formState.errors.password && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Campo Confirmar Contraseña */}
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
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                      {...register("confirmPassword", {
                        required: "Confirma tu contraseña",
                        validate: (value) =>
                          value === passwordValue || "Las contraseñas no coinciden",
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                    </button>
                  </div>
                  {formState.errors.confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Botón Guardar */}
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
                        Guardando contraseña...
                      </span>
                    ) : (
                      "Actualizar Contraseña"
                    )}
                  </button>
                </div>

                {/* Enlace Volver */}
                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <HiArrowLeft className="text-sm" />
                    Cancelar y volver al inicio
                  </Link>
                </div>
              </form>
            </>
          ) : (
            /* Estado de éxito */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-5 text-teal-600">
                <FaCheckDouble className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                ¡Contraseña Actualizada!
              </h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Tu clave ha sido reestablecida correctamente. Serás redirigido al inicio de sesión en unos momentos.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 transition-all cursor-pointer"
              >
                Ir a Iniciar Sesión ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FaShieldHeart, FaKey, FaEnvelopeCircleCheck } from "react-icons/fa6";
import { HiEnvelope, HiArrowLeft, HiCheckCircle } from "react-icons/hi2";

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { register, handleSubmit, formState } = useForm<ForgotPasswordForm>({
    mode: "onChange",
  });

  const onForgotPasswordSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);

    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(error.message || "Error al enviar el enlace de recuperación.");
    } else {
      setSubmittedEmail(data.email);
      setEmailSent(true);
      toast.success("Enlace de recuperación enviado con éxito.");
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
            alt="Consultorio Médico Dra. Oca"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-950/70 to-teal-900/60" />

          {/* Contenido sobre la imagen */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide uppercase text-teal-200 mb-6">
              <FaShieldHeart className="text-sm text-teal-300" />
              Recuperación Segura
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Historial Médico <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-300">
                Dra. Oca
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Protección de acceso y expedientes médicos confidenciales. Sigue las instrucciones para restablecer tu contraseña.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3 pt-6 border-t border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <FaKey className="text-xs" />
              </div>
              <span>Enlace de verificación temporal de un solo uso</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <FaEnvelopeCircleCheck className="text-xs" />
              </div>
              <span>Notificación directa a tu buzón oficial</span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Formulario o Confirmación */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {!emailSent ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4">
                  <FaKey className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit(onForgotPasswordSubmit)} className="space-y-5">
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
                      {...register("email", {
                        required: "El correo es requerido",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Dirección de correo inválida",
                        },
                      })}
                    />
                  </div>
                  {formState.errors.email && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formState.errors.email.message}
                    </p>
                  )}
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
                        Enviando enlace...
                      </span>
                    ) : (
                      "Enviar Enlace de Recuperación"
                    )}
                  </button>
                </div>

                {/* Volver al login */}
                <div className="text-center pt-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <HiArrowLeft className="text-sm" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            </>
          ) : (
            /* Estado de confirmación de correo enviado */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-5 text-teal-600">
                <HiCheckCircle className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                ¡Revisa tu correo electrónico!
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Hemos enviado un correo con instrucciones y un enlace seguro de recuperación a:
              </p>
              <div className="inline-block px-3.5 py-1.5 bg-slate-100 rounded-lg text-sm font-semibold text-slate-800 mb-6">
                {submittedEmail}
              </div>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                Si no lo visualizas en tu bandeja principal en unos minutos, revisa tu carpeta de correo no deseado o spam.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                >
                  ¿No recibiste el correo? Intentar nuevamente
                </button>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <HiArrowLeft className="mr-1.5 text-sm" />
                  Regresar a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState, watch, setError } = useForm<RegisterForm>();

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
        emailRedirectTo: window.location.origin + "/login"
      }
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold text-center">Registro exclusivo</h1>
            <p className="text-indigo-100 text-center mt-2">Solo usuarios autorizados</p>
          </div>
          <form className="p-6 space-y-6" onSubmit={handleSubmit(onRegisterSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" type="email" placeholder="your@email.com" {...register("email", { required: true })} />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input id="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" type="password" placeholder="••••••••" {...register("password", { required: true })} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input id="confirmPassword" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" type="password" placeholder="••••••••" {...register("confirmPassword", { required: true })} />
                {formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{formState.errors.confirmPassword.message as string}</p>
                )}
              </div>
            </div>
            <button type="submit" disabled={loading || !formState.isValid} className="cursor-pointer w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md font-medium">
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState } = useForm<LoginForm>();


  

  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      navigate("/patients");
      toast.success("You are logged in successfully!");
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold text-center">
              Login Historial Médico Dra Oca
            </h1>
            <p className="text-indigo-100 text-center mt-2">
              Control de pacientes y registros médicos
            </p>
          </div>

          <form className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", { required: true })}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: true })}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-col sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit(onLoginSubmit)}
                disabled={loading || !formState.isValid}
                className="cursor-pointer w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

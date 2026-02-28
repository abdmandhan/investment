import { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login - URS",
  description: "Sign in to your URS account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-secondary py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {/* Logo placeholder - you can replace with your actual logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-solid text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-semibold text-primary">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-tertiary">
          Welcome back! Please enter your details.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-primary px-4 py-8 shadow-sm ring-1 ring-secondary ring-inset sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

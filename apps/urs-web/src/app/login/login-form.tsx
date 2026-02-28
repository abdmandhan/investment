"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Mail01, Passcode } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    error === "CredentialsSignin" ? "Invalid username or password" : null
  );
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setFormError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      setFormError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="flex items-start gap-3 rounded-lg bg-error-primary p-4 ring-1 ring-error_subtle">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-error-primary" />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-error-primary">Error</p>
            <p className="text-sm text-error-secondary">{formError}</p>
          </div>
        </div>
      )}

      <Input
        label="Username or Email"
        placeholder="Enter your username or email"
        icon={Mail01}
        value={formData.username}
        onChange={(value) =>
          setFormData((prev) => ({ ...prev, username: value as string }))
        }
        isRequired
        autoComplete="username"
        autoFocus
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-secondary">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            required
            autoComplete="current-password"
            className="m-0 w-full rounded-lg bg-primary px-3 py-2 pl-10 text-md text-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear outline-hidden placeholder:text-placeholder focus-within:ring-2 focus-within:ring-brand"
          />
          <Passcode className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fg-quaternary" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-quaternary transition-colors hover:text-fg-quaternary_hover"
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          isSelected={formData.rememberMe}
          onChange={(isSelected) =>
            setFormData((prev) => ({ ...prev, rememberMe: isSelected as boolean }))
          }
        />
        <Button type="button" color="link-color" size="sm">
          Forgot password?
        </Button>
      </div>

      <Button
        type="submit"
        size="md"
        color="primary"
        className="w-full"
        isLoading={isLoading}
      >
        Sign in
      </Button>
    </form>
  );
}

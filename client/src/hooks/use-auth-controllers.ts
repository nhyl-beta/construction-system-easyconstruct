import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";

type Status = "idle" | "loading" | "success" | "error";

export function useLoginController() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async ({
    email,
    password,
    remember,
  }: {
    email: string;
    password: string;
    remember: boolean;
  }) => {
    setErrors({});
    setFormError(null);

    if (!email) return setErrors((e) => ({ ...e, email: "Email is required" }));
    if (!password) return setErrors((e) => ({ ...e, password: "Password is required" }));

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.token || !json.data?.user) {
        setFormError(json.message ?? "Sign in failed");
        setStatus("error");
        return;
      }

      setSession(json.data.token, json.data.user, remember);

      setStatus("success");
      navigate("/dashboard");
    } catch {
      setFormError("Unable to reach the server. Please try again.");
      setStatus("error");
    }
  };

  return { status, errors, formError, submit };
}

export function useForgotPasswordController() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (email: string) => {
    setError(null);
    if (!email) return setError("Email is required");

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      setStatus(json.success ? "success" : "error");
      if (!json.success) setError(json.message ?? "Something went wrong");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return { status, error, submit };
}

export function useResetPasswordController() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});

  const submit = async (password: string, confirmPassword: string) => {
    setErrors({});
    if (password.length < 10) {
      return setErrors((e) => ({ ...e, password: "Must be at least 10 characters" }));
    }
    if (password !== confirmPassword) {
      return setErrors((e) => ({ ...e, confirmPassword: "Passwords do not match" }));
    }

    setStatus("loading");
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrors({ form: json.message ?? "Reset failed" });
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
      setStatus("error");
    }
  };

  return { status, errors, submit };
}
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Masuk — Bagisawer" };

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const initialError = error === "auth_callback"
    ? "Tautan verifikasi atau pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru jika diperlukan."
    : undefined;

  return <AuthForm mode="login" initialError={initialError} />;
}
import type { Metadata } from "next";
import LoginForm from "@/components/platform/LoginForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to your wedding dashboard</p>
      </div>

      <div className="bg-white rounded-xl shadow-apple-md p-6 sm:p-8">
        <LoginForm />
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        New here?{" "}
        <Link href="/signup" className="text-accent font-medium hover:underline">
          Create your wedding
        </Link>
      </p>
    </div>
  );
}

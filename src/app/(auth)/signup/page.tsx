import type { Metadata } from "next";
import SignupForm from "@/components/platform/SignupForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Create your wedding" };

export default function SignupPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create your wedding</h1>
        <p className="text-sm text-gray-500 mt-1">Start planning in minutes — it&apos;s free</p>
      </div>

      <div className="bg-white rounded-xl shadow-apple-md p-6 sm:p-8">
        <SignupForm />
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

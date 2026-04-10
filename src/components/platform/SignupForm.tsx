"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { generateSlug } from "@/lib/utils";

type Step = 1 | 2 | 3;

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  rsvpDeadline: string;
  venueName: string;
  venueAddress: string;
  slug: string;
}

const stepLabels = ["Account", "Your Wedding", "Your URL"];

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    partner1Name: "",
    partner2Name: "",
    weddingDate: "",
    rsvpDeadline: "",
    venueName: "",
    venueAddress: "",
    slug: "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleNamesBlur() {
    if (form.partner1Name && form.partner2Name && !form.slug) {
      const suggested = generateSlug(form.partner1Name, form.partner2Name);
      update("slug", suggested);
    }
  }

  async function checkSlug(slug: string) {
    if (!slug || slug.length < 3) return;
    setCheckingSlug(true);
    const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
    const { available } = await res.json();
    setSlugAvailable(available);
    setCheckingSlug(false);
  }

  function validateStep(): boolean {
    if (step === 1) {
      if (!form.email || !form.password) { setError("Please fill in all fields."); return false; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return false; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return false; }
    }
    if (step === 2) {
      if (!form.partner1Name || !form.partner2Name) { setError("Please enter both partner names."); return false; }
      if (!form.weddingDate) { setError("Please select your wedding date."); return false; }
      if (!form.rsvpDeadline) { setError("Please set an RSVP deadline."); return false; }
    }
    if (step === 3) {
      if (!form.slug || form.slug.length < 3) { setError("Please choose a URL (at least 3 characters)."); return false; }
      if (slugAvailable === false) { setError("That URL is taken. Please choose another."); return false; }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => (s + 1) as Step);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep()) return;
    if (slugAvailable === false) { setError("That URL is taken."); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => {
          const num = (i + 1) as Step;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                    isDone
                      ? "bg-accent text-white"
                      : isActive
                      ? "bg-accent text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    num
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px ${isDone ? "bg-accent" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              hint="Minimum 8 characters"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Partner 1 name"
                value={form.partner1Name}
                onChange={(e) => update("partner1Name", e.target.value)}
                onBlur={handleNamesBlur}
                placeholder="Alex"
                required
              />
              <Input
                label="Partner 2 name"
                value={form.partner2Name}
                onChange={(e) => update("partner2Name", e.target.value)}
                onBlur={handleNamesBlur}
                placeholder="Jordan"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Wedding date"
                type="date"
                value={form.weddingDate}
                onChange={(e) => update("weddingDate", e.target.value)}
                required
              />
              <Input
                label="RSVP deadline"
                type="date"
                value={form.rsvpDeadline}
                onChange={(e) => update("rsvpDeadline", e.target.value)}
                hint="When should guests RSVP by?"
                required
              />
            </div>
            <Input
              label="Venue name"
              value={form.venueName}
              onChange={(e) => update("venueName", e.target.value)}
              placeholder="The Grand Ballroom"
            />
            <Input
              label="Venue address"
              value={form.venueAddress}
              onChange={(e) => update("venueAddress", e.target.value)}
              placeholder="123 Main St, City, State 00000"
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-500">
              Choose the URL for your public wedding page. Guests will visit this to RSVP and see your wedding details.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Your wedding URL</label>
              <div className="flex items-center bg-gray-100 rounded-md overflow-hidden ring-0 focus-within:ring-2 focus-within:ring-accent/25 focus-within:bg-white transition-all duration-150">
                <span className="pl-4 pr-1 text-[15px] text-gray-400 font-sans whitespace-nowrap">vows.app/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    update("slug", val);
                    setSlugAvailable(null);
                  }}
                  onBlur={() => checkSlug(form.slug)}
                  placeholder="alex-and-jordan"
                  className="flex-1 bg-transparent py-3 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none font-sans"
                />
                {checkingSlug && (
                  <div className="pr-3">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-accent animate-spin" />
                  </div>
                )}
                {!checkingSlug && slugAvailable === true && (
                  <span className="pr-3 text-green-500 text-sm">✓</span>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <span className="pr-3 text-red-500 text-sm">✗</span>
                )}
              </div>
              {slugAvailable === true && (
                <p className="text-xs text-green-600">Available! Your guests will visit vows.app/{form.slug}</p>
              )}
              {slugAvailable === false && (
                <p className="text-xs text-red-500">That URL is already taken. Try something else.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex-1"
          >
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={next}
            className="flex-1"
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="flex-1"
          >
            Create my wedding
          </Button>
        )}
      </div>
    </form>
  );
}

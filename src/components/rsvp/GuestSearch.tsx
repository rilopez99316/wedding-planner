"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchGuestsAction } from "@/lib/actions/guests";
import { GroupPublicData } from "./RSVPPageClient";
import Input from "@/components/ui/Input";

interface GuestSearchProps {
  weddingId: string;
  onSelect: (group: GroupPublicData) => void;
}

function GroupAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-champagne flex items-center justify-center shrink-0">
      <span className="font-serif text-sm font-light text-navy/65">{initials}</span>
    </div>
  );
}

export default function GuestSearch({ weddingId, onSelect }: GuestSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupPublicData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const groups = await searchGuestsAction(query, weddingId);
        const mapped: GroupPublicData[] = groups.map((g) => ({
          id: g.id,
          groupName: g.groupName,
          hasPlusOne: g.hasPlusOne,
          plusOneNameIfKnown: g.plusOneNameIfKnown ?? undefined,
          hasExistingResponse: !!g.rsvpResponse,
          guests: g.guests.map((guest) => ({
            id: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            isPlusOne: guest.isPlusOne,
          })),
          allowedEventKeys: g.allowedEvents.map((ae) => ae.event.key),
        }));
        setResults(mapped);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, weddingId]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(group: GroupPublicData) {
    setQuery("");
    setOpen(false);
    setResults([]);
    onSelect(group);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Input
        label="Find your name"
        placeholder="Start typing your name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        hint="Search by first name, last name, or family group"
        autoComplete="off"
      />

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gold/15 rounded-xl shadow-apple-lg overflow-hidden"
          >
            {loading ? (
              <li className="px-5 py-6 text-center">
                <p className="text-sm font-serif text-navy/35">Searching…</p>
              </li>
            ) : results.length > 0 ? (
              results.map((group) => (
                <li key={group.id} className="border-b border-navy/5 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(group)}
                    className="w-full text-left px-5 py-4 hover:bg-champagne/35 transition-colors duration-150 flex items-center gap-4"
                  >
                    <GroupAvatar name={group.groupName} />
                    <div>
                      <p className="font-serif text-base font-light text-navy">
                        {group.groupName}
                      </p>
                      <p className="text-xs text-navy/40 font-sans mt-0.5">
                        {group.guests.map((g) => g.firstName).join(", ")}
                        {group.hasPlusOne && " + Guest"}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-5 py-7 text-center">
                <p className="text-sm font-serif text-navy/65">
                  Name not found in our guest list
                </p>
                <p className="text-xs text-navy/35 font-sans mt-1.5 leading-relaxed">
                  Please double-check your spelling or contact us directly.
                </p>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

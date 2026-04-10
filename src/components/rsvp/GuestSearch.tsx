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

  // Close on outside click
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 left-0 right-0 mt-1 bg-white border border-navy/10 shadow-lg shadow-navy/5 overflow-hidden"
          >
            {loading ? (
              <li className="px-5 py-5 text-center">
                <p className="text-sm font-serif text-navy/40">Searching…</p>
              </li>
            ) : results.length > 0 ? (
              results.map((group) => (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(group)}
                    className="w-full text-left px-5 py-4 hover:bg-champagne/40 transition-colors duration-150 border-b border-navy/5 last:border-0"
                  >
                    <p className="font-serif text-base font-light text-navy">
                      {group.groupName}
                    </p>
                    <p className="text-xs text-navy/40 font-sans mt-0.5">
                      {group.guests.map((g) => g.firstName).join(", ")}
                      {group.hasPlusOne && " + Guest"}
                    </p>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-5 py-5 text-center">
                <p className="text-sm font-serif text-navy/70">
                  Name not found in our guest list
                </p>
                <p className="text-xs text-navy/40 font-sans mt-1">
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

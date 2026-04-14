"use client";

import { useEffect, useRef, useState } from "react";

interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl60: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const PLATFORMS = [
  {
    label: "Spotify",
    textColor: "text-[#1DB954]",
    bg: "bg-[#1DB954]/10 hover:bg-[#1DB954]/20",
    href: (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.793c3.543-1.073 9.434-.866 13.158 1.297a.937.937 0 01-.998 1.653z"/>
      </svg>
    ),
  },
  {
    label: "Apple Music",
    textColor: "text-[#FC3C44]",
    bg: "bg-[#FC3C44]/10 hover:bg-[#FC3C44]/20",
    href: (q: string) => `https://music.apple.com/search?term=${encodeURIComponent(q)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1 4.975 4.975 0 001.98-.592c1.23-.682 2.02-1.707 2.38-3.08.164-.633.21-1.28.232-1.933.01-.203.013-.406.013-.61V6.787c-.003-.22-.01-.44-.027-.663zM12 15.77a3.77 3.77 0 110-7.54 3.77 3.77 0 010 7.54zm4.253-6.803a.972.972 0 110-1.944.972.972 0 010 1.944z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    textColor: "text-[#FF0000]",
    bg: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20",
    href: (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
      </svg>
    ),
  },
  {
    label: "YT Music",
    textColor: "text-[#FF0000]",
    bg: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20",
    href: (q: string) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z"/>
      </svg>
    ),
  },
];

export default function SongSearchInput({ value, onChange, placeholder, id }: Props) {
  const [query, setQuery]           = useState(value);
  const [results, setResults]       = useState<iTunesTrack[]>([]);
  const [selected, setSelected]     = useState<iTunesTrack | null>(null);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const containerRef                = useRef<HTMLDivElement>(null);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userHasTyped                = useRef(false);

  // Keep query in sync when value changes externally
  useEffect(() => {
    setQuery(value);
    if (!value) setSelected(null);
  }, [value]);

  // Debounced iTunes search
  useEffect(() => {
    if (!userHasTyped.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=8`
        );
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Silent artwork fetch on mount for pre-saved values
  useEffect(() => {
    if (!value?.trim()) return;
    fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(value.trim())}&entity=song&limit=1`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.results?.length > 0) setSelected(data.results[0]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleSelect(track: iTunesTrack) {
    const formatted = `${track.trackName} — ${track.artistName}`;
    setQuery(formatted);
    setSelected(track);
    onChange(formatted);
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    setSelected(null);
    onChange("");
    setResults([]);
    setOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    userHasTyped.current = true;
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    if (selected) setSelected(null);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div className="relative flex items-center">
        {/* Left: album art thumbnail (when selected) or music icon */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          {selected?.artworkUrl60 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.artworkUrl60}
              alt=""
              width={22}
              height={22}
              className="rounded-md object-cover"
            />
          ) : (
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
        </div>

        <input
          id={id}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition"
        />

        {/* Right: spinner or clear */}
        <div className="absolute right-3">
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-accent rounded-full animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-300 hover:text-gray-500 transition"
              aria-label="Clear"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="py-1.5 max-h-72 overflow-y-auto">
            {results.map((track, i) => (
              <button
                key={track.trackId}
                type="button"
                onClick={() => handleSelect(track)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 transition-colors text-left group"
              >
                {track.artworkUrl60 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.artworkUrl60}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-lg shrink-0 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate leading-tight">{track.trackName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{track.artistName}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-accent shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
          <div className="px-3.5 py-2 border-t border-gray-50">
            <p className="text-[10px] text-gray-400">Results from Apple Music · Select to fill</p>
          </div>
        </div>
      )}

      {/* Listen on — shown when a value is set */}
      {value && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mr-0.5">Listen on</span>
          {PLATFORMS.map((p) => (
            <a
              key={p.label}
              href={p.href(value)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${p.textColor} ${p.bg}`}
            >
              {p.icon}
              {p.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

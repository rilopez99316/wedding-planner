"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import SongSearchInput from "@/components/ui/SongSearchInput";
import { updateMusicAction } from "@/lib/actions/ceremony";
import {
  updateReceptionSongsAction,
  updateDjNotesAction,
  addMusicSongAction,
  deleteMusicSongAction,
  updatePlaylistUrlAction,
} from "@/lib/actions/music";

// ── Types ──────────────────────────────────────────────────────────────────

interface SongEntry {
  id: string;
  title: string;
  artist: string | null;
}

interface MusicClientProps {
  ceremonySongs: {
    processionalSong: string | null;
    recessionalSong:  string | null;
  };
  receptionSongs: {
    grandEntranceSong:        string | null;
    firstDanceSong:           string | null;
    fatherDaughterSong:       string | null;
    motherSonSong:            string | null;
    weddingPartyEntranceSong: string | null;
    cakeCuttingSong:          string | null;
    lastDanceSong:            string | null;
  };
  djNotes: string | null;
  mustPlayPlaylistUrl:   string | null;
  doNotPlayPlaylistUrl:  string | null;
  initialMustPlay:  SongEntry[];
  initialDoNotPlay: SongEntry[];
}

// ── Section card wrapper ───────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Save button ────────────────────────────────────────────────────────────

function SaveButton({
  saving,
  saved,
  onClick,
  label = "Save",
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={cn(
        "mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]",
        saved
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
    >
      {saving ? "Saving…" : saved ? "✓ Saved" : label}
    </button>
  );
}

// ── Platform detection ─────────────────────────────────────────────────────

type Platform = "spotify" | "apple_music" | "youtube_music" | "other";

function detectPlatform(url: string): Platform {
  try {
    const { hostname } = new URL(url);
    if (hostname.includes("spotify.com"))      return "spotify";
    if (hostname.includes("music.apple.com"))  return "apple_music";
    if (hostname.includes("music.youtube.com")) return "youtube_music";
    if (hostname.includes("youtube.com") && url.includes("playlist")) return "youtube_music";
  } catch {
    // ignore invalid URLs
  }
  return "other";
}

const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  spotify: {
    label: "Spotify",
    color: "text-[#1DB954]",
    bg: "bg-[#1DB954]/10",
    border: "border-[#1DB954]/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 17.308a.748.748 0 01-1.03.25c-2.822-1.726-6.375-2.116-10.562-1.16a.748.748 0 11-.335-1.457c4.579-1.048 8.511-.597 11.677 1.337a.748.748 0 01.25 1.03zm1.484-3.305a.936.936 0 01-1.288.308C14.85 12.424 11.1 11.938 7.56 13.02a.935.935 0 11-.543-1.79c4.043-1.228 8.268-.633 11.72 1.486a.937.937 0 01.309 1.287zm.128-3.44c-3.696-2.196-9.797-2.398-13.323-1.327a1.123 1.123 0 11-.652-2.149c4.051-1.228 10.786-1 15.03 1.536a1.123 1.123 0 11-1.055 1.94z"/>
      </svg>
    ),
  },
  apple_music: {
    label: "Apple Music",
    color: "text-[#FA233B]",
    bg: "bg-[#FA233B]/10",
    border: "border-[#FA233B]/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208A5.24 5.24 0 00.05 5.08c-.01.154-.017.31-.02.464v13.916c.012.21.028.42.052.63.113.99.46 1.876 1.08 2.646.637.79 1.452 1.315 2.4 1.57.51.137 1.03.202 1.557.214.162.004.325.013.487.013h13.39c.175 0 .35-.005.523-.013.474-.017.94-.074 1.398-.196 1.133-.306 2.006-.974 2.645-1.94.554-.835.792-1.76.838-2.745.006-.12.011-.24.015-.36V6.364c-.003-.08-.007-.16-.011-.24zm-6.13 8.86a.68.68 0 01-.32.634c-.164.098-.34.138-.527.123a.852.852 0 01-.447-.165L11.08 12.6V7.3c0-.318.145-.54.446-.634a.723.723 0 01.745.157l5.078 3.667c.253.183.38.432.366.727a.66.66 0 01-.341.567l-5.294 3.2zm.87-5.447l-4.52-3.26V9.7l4.52 3.273V9.537z"/>
      </svg>
    ),
  },
  youtube_music: {
    label: "YouTube Music",
    color: "text-[#FF0000]",
    bg: "bg-[#FF0000]/10",
    border: "border-[#FF0000]/20",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L16.2 12l-6.516 3.54z"/>
      </svg>
    ),
  },
  other: {
    label: "Playlist",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
};

// ── Song list column ───────────────────────────────────────────────────────

function SongListColumn({
  label,
  songs,
  listType,
  playlistUrl,
  onAdd,
  onDelete,
  onPlaylistUrlSave,
}: {
  label: string;
  songs: SongEntry[];
  listType: "must_play" | "do_not_play";
  playlistUrl: string | null;
  onAdd: (song: SongEntry) => void;
  onDelete: (id: string) => void;
  onPlaylistUrlSave: (url: string | null) => void;
}) {
  const [adding, setAdding]       = useState(false);
  const [newTitle, setNewTitle]   = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingLink, setAddingLink] = useState(false);
  const [linkInput, setLinkInput]   = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const song = await addMusicSongAction({ title: newTitle.trim(), artist: newArtist.trim() || null, listType });
      onAdd({ id: song.id, title: song.title, artist: song.artist });
      setNewTitle("");
      setNewArtist("");
      setAdding(false);
      router.refresh();
    } catch {
      alert("Failed to add song.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this song?")) return;
    setDeletingId(id);
    try {
      await deleteMusicSongAction(id);
      onDelete(id);
      router.refresh();
    } catch {
      alert("Failed to remove song.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveLink() {
    const url = linkInput.trim();
    if (!url) return;
    setSavingLink(true);
    try {
      await updatePlaylistUrlAction({ listType, url });
      onPlaylistUrlSave(url);
      setAddingLink(false);
      setLinkInput("");
      router.refresh();
    } catch {
      alert("Failed to save playlist link.");
    } finally {
      setSavingLink(false);
    }
  }

  async function handleRemoveLink() {
    setSavingLink(true);
    try {
      await updatePlaylistUrlAction({ listType, url: null });
      onPlaylistUrlSave(null);
      router.refresh();
    } catch {
      alert("Failed to remove playlist link.");
    } finally {
      setSavingLink(false);
    }
  }

  const platform = playlistUrl ? detectPlatform(playlistUrl) : null;
  const meta = platform ? PLATFORM_META[platform] : null;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</p>

      {/* Playlist link card */}
      {playlistUrl && meta ? (
        <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 mb-3", meta.bg, meta.border)}>
          <span className={meta.color}>{meta.icon}</span>
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("flex-1 min-w-0 text-xs font-medium truncate underline underline-offset-2 decoration-dotted", meta.color)}
          >
            Open {meta.label} playlist
          </a>
          <button
            type="button"
            onClick={handleRemoveLink}
            disabled={savingLink}
            className="shrink-0 text-gray-300 hover:text-red-400 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : addingLink ? (
        <div className="mb-3 space-y-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste Spotify, Apple Music, or YouTube link"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSaveLink()}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveLink}
              disabled={savingLink || !linkInput.trim()}
              className="flex-1 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50 transition hover:opacity-90"
            >
              {savingLink ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setAddingLink(false); setLinkInput(""); }}
              className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold transition hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingLink(true)}
          className="mb-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Add playlist link
        </button>
      )}

      <div className="space-y-1.5 min-h-[40px]">
        {songs.length === 0 && (
          <p className="text-xs text-gray-400 italic">No songs yet</p>
        )}
        {songs.map((song) => (
          <div key={song.id} className="flex items-center gap-2 group">
            <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-gray-900 truncate">{song.title}</p>
              {song.artist && (
                <p className="text-[11px] text-gray-500 truncate">{song.artist}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(song.id)}
              disabled={deletingId === song.id}
              className="shrink-0 text-gray-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Song title"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition"
          />
          <input
            type="text"
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            placeholder="Artist (optional)"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !newTitle.trim()}
              className="flex-1 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50 transition hover:opacity-90"
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewTitle(""); setNewArtist(""); }}
              className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold transition hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add song
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MusicClient({
  ceremonySongs,
  receptionSongs,
  djNotes: initialDjNotes,
  mustPlayPlaylistUrl:  initialMustPlayUrl,
  doNotPlayPlaylistUrl: initialDoNotPlayUrl,
  initialMustPlay,
  initialDoNotPlay,
}: MusicClientProps) {
  const router = useRouter();

  // Ceremony songs
  const [proc, setProc]                   = useState(ceremonySongs.processionalSong ?? "");
  const [rec, setRec]                     = useState(ceremonySongs.recessionalSong  ?? "");
  const [savingCeremony, setSavingCeremony] = useState(false);
  const [savedCeremony, setSavedCeremony]   = useState(false);

  // Reception songs
  const [reception, setReception] = useState({
    grandEntranceSong:        receptionSongs.grandEntranceSong        ?? "",
    firstDanceSong:           receptionSongs.firstDanceSong           ?? "",
    fatherDaughterSong:       receptionSongs.fatherDaughterSong       ?? "",
    motherSonSong:            receptionSongs.motherSonSong            ?? "",
    weddingPartyEntranceSong: receptionSongs.weddingPartyEntranceSong ?? "",
    cakeCuttingSong:          receptionSongs.cakeCuttingSong          ?? "",
    lastDanceSong:            receptionSongs.lastDanceSong            ?? "",
  });
  const [savingReception, setSavingReception] = useState(false);
  const [savedReception, setSavedReception]   = useState(false);

  // Song lists
  const [mustPlay,  setMustPlay]  = useState<SongEntry[]>(initialMustPlay);
  const [doNotPlay, setDoNotPlay] = useState<SongEntry[]>(initialDoNotPlay);

  // Playlist URLs
  const [mustPlayUrl,  setMustPlayUrl]  = useState<string | null>(initialMustPlayUrl ?? null);
  const [doNotPlayUrl, setDoNotPlayUrl] = useState<string | null>(initialDoNotPlayUrl ?? null);

  // DJ notes
  const [djNotes, setDjNotes]               = useState(initialDjNotes ?? "");
  const [savingNotes, setSavingNotes]         = useState(false);
  const [savedNotes, setSavedNotes]           = useState(false);

  async function handleSaveCeremony() {
    setSavingCeremony(true);
    try {
      await updateMusicAction({ processionalSong: proc || null, recessionalSong: rec || null });
      setSavedCeremony(true);
      setTimeout(() => setSavedCeremony(false), 2500);
      router.refresh();
    } catch {
      alert("Failed to save ceremony songs.");
    } finally {
      setSavingCeremony(false);
    }
  }

  async function handleSaveReception() {
    setSavingReception(true);
    try {
      await updateReceptionSongsAction({
        grandEntranceSong:        reception.grandEntranceSong        || null,
        firstDanceSong:           reception.firstDanceSong           || null,
        fatherDaughterSong:       reception.fatherDaughterSong       || null,
        motherSonSong:            reception.motherSonSong            || null,
        weddingPartyEntranceSong: reception.weddingPartyEntranceSong || null,
        cakeCuttingSong:          reception.cakeCuttingSong          || null,
        lastDanceSong:            reception.lastDanceSong            || null,
      });
      setSavedReception(true);
      setTimeout(() => setSavedReception(false), 2500);
      router.refresh();
    } catch {
      alert("Failed to save reception songs.");
    } finally {
      setSavingReception(false);
    }
  }

  async function handleSaveDjNotes() {
    setSavingNotes(true);
    try {
      await updateDjNotesAction({ djNotes: djNotes || null });
      setSavedNotes(true);
      setTimeout(() => setSavedNotes(false), 2500);
      router.refresh();
    } catch {
      alert("Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  const receptionFields: { key: keyof typeof reception; label: string; placeholder: string }[] = [
    { key: "grandEntranceSong",        label: "Grand Entrance",        placeholder: "e.g. Crazy in Love — Beyoncé" },
    { key: "firstDanceSong",           label: "First Dance",           placeholder: "e.g. At Last — Etta James" },
    { key: "fatherDaughterSong",       label: "Father-Daughter",       placeholder: "e.g. My Girl — The Temptations" },
    { key: "motherSonSong",            label: "Mother-Son",            placeholder: "e.g. A Song for Mama — Boyz II Men" },
    { key: "weddingPartyEntranceSong", label: "Wedding Party Entrance", placeholder: "e.g. Happy — Pharrell Williams" },
    { key: "cakeCuttingSong",          label: "Cake Cutting",          placeholder: "e.g. Sugar — Maroon 5" },
    { key: "lastDanceSong",            label: "Last Dance",            placeholder: "e.g. Don't Stop Believin' — Journey" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* ── Ceremony Songs ──────────────────────────────────────────────── */}
      <SectionCard title="Ceremony Songs">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <span className="text-gray-300 text-sm">♪</span>
              Processional
            </label>
            <SongSearchInput
              value={proc}
              onChange={(v) => { setProc(v); setSavedCeremony(false); }}
              placeholder="e.g. Canon in D — Pachelbel"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <span className="text-gray-300 text-sm">♫</span>
              Recessional
            </label>
            <SongSearchInput
              value={rec}
              onChange={(v) => { setRec(v); setSavedCeremony(false); }}
              placeholder="e.g. Ode to Joy — Beethoven"
            />
          </div>
          <SaveButton saving={savingCeremony} saved={savedCeremony} onClick={handleSaveCeremony} label="Save Ceremony Songs" />
        </div>
      </SectionCard>

      {/* ── Reception Moments ───────────────────────────────────────────── */}
      <SectionCard title="Reception Moments">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          {receptionFields.map(({ key, label, placeholder }) => (
            <div key={key} className={key === "weddingPartyEntranceSong" ? "col-span-2" : ""}>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                {label}
              </label>
              <SongSearchInput
                value={reception[key]}
                onChange={(v) => { setReception((prev) => ({ ...prev, [key]: v })); setSavedReception(false); }}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <SaveButton saving={savingReception} saved={savedReception} onClick={handleSaveReception} label="Save Reception Songs" />
      </SectionCard>

      {/* ── Song Lists ──────────────────────────────────────────────────── */}
      <SectionCard title="Song Lists">
        <div className="flex gap-6">
          <SongListColumn
            label="Must Play"
            songs={mustPlay}
            listType="must_play"
            playlistUrl={mustPlayUrl}
            onAdd={(s) => setMustPlay((prev) => [...prev, s])}
            onDelete={(id) => setMustPlay((prev) => prev.filter((s) => s.id !== id))}
            onPlaylistUrlSave={setMustPlayUrl}
          />
          <div className="w-px bg-gray-100 shrink-0" />
          <SongListColumn
            label="Do Not Play"
            songs={doNotPlay}
            listType="do_not_play"
            playlistUrl={doNotPlayUrl}
            onAdd={(s) => setDoNotPlay((prev) => [...prev, s])}
            onDelete={(id) => setDoNotPlay((prev) => prev.filter((s) => s.id !== id))}
            onPlaylistUrlSave={setDoNotPlayUrl}
          />
        </div>
      </SectionCard>

      {/* ── DJ / Band Notes ─────────────────────────────────────────────── */}
      <SectionCard title="DJ / Band Notes">
        <textarea
          value={djNotes}
          onChange={(e) => { setDjNotes(e.target.value); setSavedNotes(false); }}
          placeholder="Notes for your DJ or band — vibe, genres, special requests, timeline cues…"
          rows={5}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition resize-none"
        />
        <SaveButton saving={savingNotes} saved={savedNotes} onClick={handleSaveDjNotes} label="Save Notes" />
      </SectionCard>
    </div>
  );
}

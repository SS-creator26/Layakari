// Taals, forms and layas. Shared by the server, the player and the database checks
// (supabase/migrations/20261015000100_core_schema.sql uses the same lists).

export type TaalId = "teentaal" | "jhaptaal" | "rupak" | "ektaal" | "dhamar";

export interface Taal {
  id: TaalId;
  name: string;
  /** Matras in one cycle. */
  beats: number;
  /** The theka, one bol per matra. "–" is a rest. */
  bols: string[];
  /** Vibhag marks keyed by matra index: "X" is sam, "0" khali, numbers are tali. */
  marks: Record<number, string>;
  about: string;
}

export const TAALS: Record<TaalId, Taal> = {
  teentaal: {
    id: "teentaal",
    name: "Teentaal",
    beats: 16,
    bols: ["Dha", "Dhin", "Dhin", "Dha", "Dha", "Dhin", "Dhin", "Dha", "Dha", "Tin", "Tin", "Ta", "Ta", "Dhin", "Dhin", "Dha"],
    marks: { 0: "X", 4: "2", 8: "0", 12: "3" },
    about: "Sixteen matras in four vibhags of four. The most common taal in Kathak and tabla, played at every laya from slow vilambit to fast drut.",
  },
  jhaptaal: {
    id: "jhaptaal",
    name: "Jhaptaal",
    beats: 10,
    bols: ["Dhi", "Na", "Dhi", "Dhi", "Na", "Ti", "Na", "Dhi", "Dhi", "Na"],
    marks: { 0: "X", 2: "2", 5: "0", 7: "3" },
    about: "Ten matras divided 2-3-2-3. Its uneven vibhags give tukdas and relas a lilting, off-balance pull towards sam.",
  },
  rupak: {
    id: "rupak",
    name: "Rupak",
    beats: 7,
    bols: ["Tin", "Tin", "Na", "Dhi", "Na", "Dhi", "Na"],
    marks: { 0: "0", 3: "1", 5: "2" },
    about: "Seven matras divided 3-2-2. Unusually, the cycle begins on khali, so sam falls on an open stroke.",
  },
  ektaal: {
    id: "ektaal",
    name: "Ektaal",
    beats: 12,
    bols: ["Dhin", "Dhin", "DhaGe", "Tirakita", "Tu", "Na", "Kat", "Ta", "DhaGe", "Tirakita", "Dhi", "Na"],
    marks: { 0: "X", 2: "0", 4: "2", 6: "0", 8: "3", 10: "4" },
    about: "Twelve matras in six vibhags of two. Heard in slow khayal and in Kathak gat nikas and thaat.",
  },
  dhamar: {
    id: "dhamar",
    name: "Dhamar",
    beats: 14,
    bols: ["Ka", "Dhi", "Ta", "Dhi", "Ta", "Dha", "–", "Ga", "Ti", "Ta", "Ti", "Ta", "Ta", "–"],
    marks: { 0: "X", 5: "2", 7: "0", 10: "3" },
    about: "Fourteen matras divided 5-2-3-4. An old, stately taal from dhrupad, with long phrases that resolve on sam.",
  },
};

export const TAAL_IDS = Object.keys(TAALS) as TaalId[];

export function taalOf(id: string | null | undefined): Taal {
  return TAALS[(id as TaalId) ?? "teentaal"] ?? TAALS.teentaal;
}

export function isTaalId(id: string): id is TaalId {
  return id in TAALS;
}

export const FORMS = ["Paran", "Tukda", "Tihai", "Chakradar", "Kavitt", "Gat", "Tatkar", "Amad", "Thaat", "Peshkar", "Kaida", "Rela"] as const;
export type Form = (typeof FORMS)[number];

export const LAYAS = ["Vilambit", "Madhya", "Drut"] as const;
export type Laya = (typeof LAYAS)[number];

export const ROLES = [
  ["listener", "Listener"],
  ["dancer", "Dancer"],
  ["tabla", "Tabla player"],
  ["composer", "Composer"],
  ["choreographer", "Choreographer"],
  ["guru", "Guru / teacher"],
  ["student", "Student"],
] as const;
export type Role = (typeof ROLES)[number][0];

export function roleLabel(role: string): string {
  return ROLES.find(([id]) => id === role)?.[1] ?? role;
}

/** Columns for the beat grid: one row for short taals, two rows for longer ones. */
export function beatColumns(beats: number): number {
  return beats > 8 ? Math.ceil(beats / 2) : beats;
}

export const MIN_BPM = 40;
export const MAX_BPM = 180;

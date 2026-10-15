import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AcademyRow, ChoreographyRow, CompositionRow, LevelRow, MemberRow } from "@/lib/supabase/database.types";

export type PersonRef = Pick<MemberRow, "id" | "handle" | "name" | "city">;
export type CompositionCard = CompositionRow & { owner: PersonRef };

const PERSON = "id, handle, name, city";
const CARD = `*, owner:members!compositions_owner_id_fkey(${PERSON})`;

export interface CatalogueFilters {
  q?: string;
  taal?: string;
  laya?: string;
}

function matches(text: string, q: string) {
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

/** Published compositions, newest first. Text search runs here; the catalogue is small enough. */
export const listCompositions = cache(async (filters: CatalogueFilters = {}): Promise<CompositionCard[]> => {
  const supabase = await createClient();
  let query = supabase.from("compositions").select(CARD).eq("status", "published").order("created_at", { ascending: false }).limit(500);
  if (filters.taal) query = query.eq("taal", filters.taal);
  if (filters.laya) query = query.eq("laya", filters.laya);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as CompositionCard[];
  const q = filters.q?.trim();
  return q ? rows.filter((c) => matches(`${c.title} ${c.form} ${c.taal} ${c.owner?.name ?? ""}`, q)) : rows;
});

export interface ArtistCard extends MemberRow {
  compositionCount: number;
}

/** People with published work or a creative role, most prolific first. */
export const listArtists = cache(async (q?: string): Promise<ArtistCard[]> => {
  const supabase = await createClient();
  const [{ data: members, error }, { data: comps }] = await Promise.all([
    supabase.from("members").select("*").order("name"),
    supabase.from("compositions").select("owner_id").eq("status", "published"),
  ]);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const c of comps ?? []) counts.set(c.owner_id, (counts.get(c.owner_id) ?? 0) + 1);
  return (members ?? [])
    .map((m) => ({ ...m, compositionCount: counts.get(m.id) ?? 0 }))
    .filter((m) => m.compositionCount > 0 || m.roles.some((r) => ["composer", "choreographer", "guru"].includes(r)))
    .filter((m) => !q || matches(`${m.name} ${m.city} ${m.roles.join(" ")}`, q))
    .sort((a, b) => b.compositionCount - a.compositionCount || a.name.localeCompare(b.name));
});

export interface AcademyCard extends AcademyRow {
  guru: PersonRef;
  levels: Pick<LevelRow, "id" | "name" | "position">[];
  pieceCount: number;
}

export const listAcademies = cache(async (q?: string): Promise<AcademyCard[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academies")
    .select(`*, guru:members!academies_guru_id_fkey(${PERSON}), levels:academy_levels(id, name, position, pieces:level_pieces(composition_id))`)
    .order("name");
  if (error) throw error;
  type Raw = AcademyRow & { guru: PersonRef; levels: (Pick<LevelRow, "id" | "name" | "position"> & { pieces: { composition_id: string }[] })[] };
  return ((data ?? []) as unknown as Raw[])
    .map((a) => {
      const pieces = new Set(a.levels.flatMap((l) => l.pieces.map((p) => p.composition_id)));
      const levels = [...a.levels].sort((x, y) => x.position - y.position).map(({ id, name, position }) => ({ id, name, position }));
      return { ...a, levels, pieceCount: pieces.size };
    })
    .filter((a) => !q || matches(`${a.name} ${a.about} ${a.guru?.name ?? ""} ${a.guru?.city ?? ""}`, q))
    .sort((a, b) => Number(b.open) - Number(a.open) || a.name.localeCompare(b.name));
});

export interface CompositionPage {
  composition: CompositionCard & { owner: PersonRef & Pick<MemberRow, "bio" | "roles"> };
  choreographies: (ChoreographyRow & { owner: PersonRef })[];
  moreByOwner: CompositionCard[];
  taughtAt: { academy: Pick<AcademyRow, "id" | "name" | "slug">; level: string; guru: PersonRef }[];
}

export const getComposition = cache(async (slug: string): Promise<CompositionPage | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compositions")
    .select(`*, owner:members!compositions_owner_id_fkey(${PERSON}, bio, roles)`)
    .ilike("slug", slug.replace(/[%_\\]/g, ""))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const composition = data as unknown as CompositionPage["composition"];

  const [chors, more, taught] = await Promise.all([
    supabase
      .from("choreographies")
      .select(`*, owner:members!choreographies_owner_id_fkey(${PERSON})`)
      .eq("composition_id", composition.id)
      .order("created_at"),
    supabase
      .from("compositions")
      .select(CARD)
      .eq("owner_id", composition.owner_id)
      .eq("status", "published")
      .neq("id", composition.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("level_pieces")
      .select(`level:academy_levels!level_pieces_level_id_fkey(name, position, academy:academies!academy_levels_academy_id_fkey(id, name, slug, guru:members!academies_guru_id_fkey(${PERSON})))`)
      .eq("composition_id", composition.id),
  ]);

  type TaughtRaw = { level: { name: string; position: number; academy: Pick<AcademyRow, "id" | "name" | "slug"> & { guru: PersonRef } } | null };
  const byAcademy = new Map<string, CompositionPage["taughtAt"][number] & { position: number }>();
  for (const row of (taught.data ?? []) as unknown as TaughtRaw[]) {
    const l = row.level;
    if (!l?.academy) continue;
    const prev = byAcademy.get(l.academy.id);
    if (!prev || l.position < prev.position) {
      const { guru, ...academy } = l.academy;
      byAcademy.set(l.academy.id, { academy, guru, level: l.name, position: l.position });
    }
  }

  return {
    composition,
    choreographies: (chors.data ?? []) as unknown as CompositionPage["choreographies"],
    moreByOwner: (more.data ?? []) as unknown as CompositionCard[],
    taughtAt: [...byAcademy.values()].map(({ position: _position, ...t }) => t),
  };
});

export interface ArtistPage {
  member: MemberRow;
  compositions: CompositionCard[];
  choreographies: (ChoreographyRow & { composition: Pick<CompositionRow, "slug" | "title"> | null })[];
  academy: AcademyCard | null;
}

export const getArtist = cache(async (handle: string): Promise<ArtistPage | null> => {
  const supabase = await createClient();
  const { data: member } = await supabase.from("members").select("*").ilike("handle", handle.replace(/[%_\\]/g, "")).maybeSingle();
  if (!member) return null;
  const [comps, chors, academies] = await Promise.all([
    supabase.from("compositions").select(CARD).eq("owner_id", member.id).eq("status", "published").order("created_at", { ascending: false }),
    supabase
      .from("choreographies")
      .select("*, composition:compositions!choreographies_composition_id_fkey(slug, title)")
      .eq("owner_id", member.id)
      .order("created_at", { ascending: false }),
    listAcademies(),
  ]);
  return {
    member,
    compositions: (comps.data ?? []) as unknown as CompositionCard[],
    choreographies: (chors.data ?? []) as unknown as ArtistPage["choreographies"],
    academy: academies.find((a) => a.guru_id === member.id) ?? null,
  };
});

export interface AcademyPage {
  academy: AcademyRow & { guru: PersonRef & Pick<MemberRow, "bio"> };
  levels: (LevelRow & { pieces: CompositionCard[] })[];
}

export const getAcademy = cache(async (slug: string): Promise<AcademyPage | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academies")
    .select(`*, guru:members!academies_guru_id_fkey(${PERSON}, bio)`)
    .ilike("slug", slug.replace(/[%_\\]/g, ""))
    .maybeSingle();
  if (!data) return null;
  const academy = data as unknown as AcademyPage["academy"];
  const { data: levels } = await supabase
    .from("academy_levels")
    .select(`*, pieces:level_pieces(composition:compositions!level_pieces_composition_id_fkey(${CARD}))`)
    .eq("academy_id", academy.id)
    .order("position")
    .order("created_at");
  type Raw = LevelRow & { pieces: { composition: CompositionCard | null }[] };
  return {
    academy,
    levels: ((levels ?? []) as unknown as Raw[]).map((l) => ({
      ...l,
      pieces: l.pieces.map((p) => p.composition).filter((c): c is CompositionCard => !!c && c.status === "published"),
    })),
  };
});

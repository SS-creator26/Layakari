import "server-only";
import { createClient, getViewer } from "@/lib/supabase/server";
import type {
  AcademyRow,
  ChoreographyRow,
  CompositionRow,
  EnrollmentRow,
  LevelRow,
  LicenceRow,
  MemberRow,
  SaleRow,
} from "@/lib/supabase/database.types";
import type { CompositionCard, PersonRef } from "./public";

const PERSON = "id, handle, name, city";
const CARD = `*, owner:members!compositions_owner_id_fkey(${PERSON})`;

export interface Access {
  rank: number;
  via: string | null;
  notation: string | null;
  ownedChoreographies: string[];
}

/** What the signed-in person may see of one composition. Visitors get rank 0 and no notation. */
export async function getAccess(compositionId: string, choreographyIds: string[] = []): Promise<Access> {
  const viewer = await getViewer();
  if (!viewer) return { rank: 0, via: null, notation: null, ownedChoreographies: [] };
  const supabase = await createClient();
  const [rank, via, notation, chors] = await Promise.all([
    supabase.rpc("licence_rank", { p_composition: compositionId }),
    supabase.rpc("academy_access", { p_composition: compositionId }),
    supabase.from("composition_notation").select("bols").eq("composition_id", compositionId).maybeSingle(),
    choreographyIds.length
      ? supabase.from("licences").select("choreography_id").eq("buyer_id", viewer.id).in("choreography_id", choreographyIds)
      : Promise.resolve({ data: [] as Pick<LicenceRow, "choreography_id">[] }),
  ]);
  return {
    rank: Number(rank.data ?? 0),
    via: via.data ?? null,
    notation: notation.data?.bols ?? null,
    ownedChoreographies: (chors.data ?? []).map((c) => c.choreography_id).filter((x): x is string => !!x),
  };
}

export type EnrollmentStatus = "active" | "pending" | "declined";

/** An active row whose level was removed reads as pending, as the guru must place the student again. */
export function enrollmentStatus(e: Pick<EnrollmentRow, "status" | "level_id">): EnrollmentStatus {
  if (e.status === "active" && !e.level_id) return "pending";
  return e.status;
}

export async function getMyEnrollment(academyId: string): Promise<EnrollmentRow | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("enrollments").select("*").eq("academy_id", academyId).eq("student_id", viewer.id).maybeSingle();
  return data ?? null;
}

// ---------------------------------------------------------------- Library

export interface LibraryLicence {
  composition: CompositionCard;
  kinds: LicenceRow["kind"][];
}

export interface Membership {
  academy: AcademyRow & { guru: PersonRef };
  status: EnrollmentStatus;
  level: LevelRow | null;
  pieces: CompositionCard[];
}

export async function getLibrary(userId: string): Promise<{ licences: LibraryLicence[]; memberships: Membership[] }> {
  const supabase = await createClient();
  const [lic, enr] = await Promise.all([
    supabase
      .from("licences")
      .select(`kind, created_at, composition:compositions!licences_composition_id_fkey(${CARD})`)
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select(`*, academy:academies!enrollments_academy_id_fkey(*, guru:members!academies_guru_id_fkey(${PERSON}))`)
      .eq("student_id", userId)
      .order("requested_at"),
  ]);

  const byComp = new Map<string, LibraryLicence>();
  for (const row of (lic.data ?? []) as unknown as { kind: LicenceRow["kind"]; composition: CompositionCard | null }[]) {
    if (!row.composition) continue;
    const entry = byComp.get(row.composition.id) ?? { composition: row.composition, kinds: [] };
    if (!entry.kinds.includes(row.kind)) entry.kinds.push(row.kind);
    byComp.set(row.composition.id, entry);
  }

  type EnrRaw = EnrollmentRow & { academy: Membership["academy"] };
  const enrollments = (enr.data ?? []) as unknown as EnrRaw[];
  const academyIds = enrollments.map((e) => e.academy_id);
  const { data: levels } = academyIds.length
    ? await supabase
        .from("academy_levels")
        .select(`*, pieces:level_pieces(composition:compositions!level_pieces_composition_id_fkey(${CARD}))`)
        .in("academy_id", academyIds)
        .order("position")
    : { data: [] };
  type LevelRaw = LevelRow & { pieces: { composition: CompositionCard | null }[] };
  const allLevels = (levels ?? []) as unknown as LevelRaw[];

  const memberships = enrollments.map((e): Membership => {
    const status = enrollmentStatus(e);
    const level = allLevels.find((l) => l.id === e.level_id) ?? null;
    const pieces =
      status === "active" && level
        ? uniqueById(
            allLevels
              .filter((l) => l.academy_id === e.academy_id && l.position <= level.position)
              .flatMap((l) => l.pieces.map((p) => p.composition))
              .filter((c): c is CompositionCard => !!c),
          )
        : [];
    const { pieces: _pieces, ...levelRow } = (level ?? { pieces: [] }) as LevelRaw;
    return { academy: e.academy, status, level: level ? (levelRow as LevelRow) : null, pieces };
  });

  return { licences: [...byComp.values()], memberships };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

// ---------------------------------------------------------------- Studio

export interface Studio {
  compositions: CompositionRow[];
  choreographies: (ChoreographyRow & { composition: (Pick<CompositionRow, "slug" | "title" | "taal"> & { owner: PersonRef }) | null })[];
  sales: SaleRow[];
  taughtIn: number;
}

export async function getStudio(userId: string): Promise<Studio> {
  const supabase = await createClient();
  const [comps, chors, sales] = await Promise.all([
    supabase.from("compositions").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("choreographies")
      .select(`*, composition:compositions!choreographies_composition_id_fkey(slug, title, taal, owner:members!compositions_owner_id_fkey(${PERSON}))`)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    supabase.rpc("my_sales"),
  ]);
  const ids = (comps.data ?? []).map((c) => c.id);
  const { data: taught } = ids.length
    ? await supabase.from("level_pieces").select("level:academy_levels!level_pieces_level_id_fkey(academy_id)").in("composition_id", ids)
    : { data: [] };
  const academies = new Set(
    ((taught ?? []) as unknown as { level: { academy_id: string } | null }[]).map((t) => t.level?.academy_id).filter(Boolean),
  );
  return {
    compositions: comps.data ?? [],
    choreographies: (chors.data ?? []) as unknown as Studio["choreographies"],
    sales: ((sales.data ?? []) as SaleRow[]).map((s) => ({ ...s, price: Number(s.price), share: Number(s.share) })),
    taughtIn: academies.size,
  };
}

export async function getOwnComposition(userId: string, id: string): Promise<(CompositionRow & { bols: string }) | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("compositions").select("*").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!data) return null;
  const { data: n } = await supabase.from("composition_notation").select("bols").eq("composition_id", id).maybeSingle();
  return { ...data, bols: n?.bols ?? "" };
}

/** Published compositions to set a choreography to. */
export async function listCompositionsForChoreography(): Promise<CompositionCard[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("compositions").select(CARD).eq("status", "published").order("title");
  return (data ?? []) as unknown as CompositionCard[];
}

// ---------------------------------------------------------------- Guru

export interface Student {
  member: PersonRef;
  enrollment: EnrollmentRow;
  status: EnrollmentStatus;
}

export interface Teachable {
  composition: CompositionCard;
  canTeach: boolean;
}

export interface GuruAcademy {
  academy: AcademyRow;
  levels: (LevelRow & { pieceIds: string[] })[];
  students: Student[];
  requests: Student[];
  teachable: Teachable[];
}

export async function getGuruAcademy(userId: string): Promise<GuruAcademy | null> {
  const supabase = await createClient();
  const { data: academy } = await supabase.from("academies").select("*").eq("guru_id", userId).maybeSingle();
  if (!academy) return null;
  const [levels, enr, own, lic] = await Promise.all([
    supabase.from("academy_levels").select("*, pieces:level_pieces(composition_id)").eq("academy_id", academy.id).order("position").order("created_at"),
    supabase
      .from("enrollments")
      .select(`*, member:members!enrollments_student_id_fkey(${PERSON})`)
      .eq("academy_id", academy.id)
      .order("requested_at"),
    supabase.from("compositions").select(CARD).eq("owner_id", userId).order("title"),
    supabase
      .from("licences")
      .select(`kind, composition:compositions!licences_composition_id_fkey(${CARD})`)
      .eq("buyer_id", userId),
  ]);

  type EnrRaw = EnrollmentRow & { member: PersonRef };
  const rows = ((enr.data ?? []) as unknown as EnrRaw[]).map(({ member, ...enrollment }) => ({
    member,
    enrollment,
    status: enrollmentStatus(enrollment),
  }));

  const teachable = new Map<string, Teachable>();
  for (const c of (own.data ?? []) as unknown as CompositionCard[]) teachable.set(c.id, { composition: c, canTeach: true });
  for (const l of (lic.data ?? []) as unknown as { kind: LicenceRow["kind"]; composition: CompositionCard | null }[]) {
    if (!l.composition || teachable.get(l.composition.id)?.canTeach) continue;
    teachable.set(l.composition.id, { composition: l.composition, canTeach: l.kind === "teach" });
  }

  type LevelRaw = LevelRow & { pieces: { composition_id: string }[] };
  return {
    academy,
    levels: ((levels.data ?? []) as unknown as LevelRaw[]).map(({ pieces, ...l }) => ({ ...l, pieceIds: pieces.map((p) => p.composition_id) })),
    students: rows.filter((r) => r.status === "active"),
    requests: rows.filter((r) => r.status === "pending"),
    teachable: [...teachable.values()].sort(
      (a, b) => Number(b.canTeach) - Number(a.canTeach) || a.composition.title.localeCompare(b.composition.title),
    ),
  };
}

export type { MemberRow };

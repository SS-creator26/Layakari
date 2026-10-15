// Types for the tables in supabase/migrations. Written by hand to match them; regenerate with
// `supabase gen types typescript` once a staging project exists, and keep the names below.

type Timestamp = string;

type Rel<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
}

type Table<Row, Insert, Rels extends Rel<string, string, string>[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: Rels;
}

export type MemberRow = {
  id: string;
  handle: string;
  name: string;
  city: string;
  bio: string;
  roles: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CompositionRow = {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  form: string;
  taal: string;
  laya: string;
  bpm: number;
  price_listen: number;
  price_perform: number;
  price_teach: number;
  preview: string;
  line_count: number;
  status: "published" | "draft";
  legacy_key: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type NotationRow = {
  composition_id: string;
  bols: string;
}

export type ChoreographyRow = {
  id: string;
  owner_id: string;
  composition_id: string | null;
  title: string;
  about: string;
  price: number;
  legacy_key: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type AcademyRow = {
  id: string;
  guru_id: string;
  slug: string;
  name: string;
  about: string;
  fee: number;
  open: boolean;
  legacy_key: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type LevelRow = {
  id: string;
  academy_id: string;
  name: string;
  position: number;
  legacy_key: string | null;
  created_at: Timestamp;
}

export type LevelPieceRow = {
  level_id: string;
  composition_id: string;
  added_at: Timestamp;
}

export type EnrollmentRow = {
  academy_id: string;
  student_id: string;
  level_id: string | null;
  status: "pending" | "active" | "declined";
  requested_at: Timestamp;
  updated_at: Timestamp;
}

export type LicenceRow = {
  id: string;
  buyer_id: string | null;
  kind: "listen" | "perform" | "teach" | "choreo";
  composition_id: string | null;
  choreography_id: string | null;
  seller_id: string | null;
  composer_id: string | null;
  price: number;
  is_demo: boolean;
  payment_ref: string | null;
  legacy_key: string | null;
  created_at: Timestamp;
}

export type SaleRow = {
  licence_id: string;
  sold_at: Timestamp;
  kind: LicenceRow["kind"];
  price: number;
  share: number;
  is_demo: boolean;
  composition_id: string | null;
  composition_title: string | null;
  choreography_title: string | null;
  buyer_name: string;
  as_seller: boolean;
  as_composer: boolean;
}

type Required<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      members: Table<MemberRow, Required<MemberRow, "id" | "name">>;
      compositions: Table<
        CompositionRow,
        Required<CompositionRow, "owner_id" | "title" | "form" | "taal" | "laya">,
        [Rel<"compositions_owner_id_fkey", "owner_id", "members">]
      >;
      composition_notation: Table<
        NotationRow,
        Required<NotationRow, "composition_id">,
        [Rel<"composition_notation_composition_id_fkey", "composition_id", "compositions">]
      >;
      choreographies: Table<
        ChoreographyRow,
        Required<ChoreographyRow, "owner_id" | "title">,
        [
          Rel<"choreographies_owner_id_fkey", "owner_id", "members">,
          Rel<"choreographies_composition_id_fkey", "composition_id", "compositions">,
        ]
      >;
      academies: Table<AcademyRow, Required<AcademyRow, "guru_id" | "name">, [Rel<"academies_guru_id_fkey", "guru_id", "members">]>;
      academy_levels: Table<
        LevelRow,
        Required<LevelRow, "academy_id" | "name">,
        [Rel<"academy_levels_academy_id_fkey", "academy_id", "academies">]
      >;
      level_pieces: Table<
        LevelPieceRow,
        Required<LevelPieceRow, "level_id" | "composition_id">,
        [
          Rel<"level_pieces_level_id_fkey", "level_id", "academy_levels">,
          Rel<"level_pieces_composition_id_fkey", "composition_id", "compositions">,
        ]
      >;
      enrollments: Table<
        EnrollmentRow,
        Required<EnrollmentRow, "academy_id" | "student_id">,
        [
          Rel<"enrollments_academy_id_fkey", "academy_id", "academies">,
          Rel<"enrollments_student_id_fkey", "student_id", "members">,
          Rel<"enrollments_level_id_fkey", "level_id", "academy_levels">,
        ]
      >;
      licences: Table<
        LicenceRow,
        never,
        [
          Rel<"licences_composition_id_fkey", "composition_id", "compositions">,
          Rel<"licences_choreography_id_fkey", "choreography_id", "choreographies">,
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      licence_rank: { Args: { p_composition: string }; Returns: number };
      academy_access: { Args: { p_composition: string }; Returns: string | null };
      can_read_notation: { Args: { p_composition: string }; Returns: boolean };
      purchase_licence: { Args: { p_composition: string; p_kind: string }; Returns: LicenceRow };
      purchase_choreography: { Args: { p_choreography: string }; Returns: LicenceRow };
      my_sales: { Args: Record<string, never>; Returns: SaleRow[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

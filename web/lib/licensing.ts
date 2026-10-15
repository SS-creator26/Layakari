// Licence kinds, ranks and revenue splits. The database enforces the same rules
// (licence_rank, revenue_share and purchase_licence in supabase/migrations/20261015000200_access_rules.sql);
// these copies drive the interface.

export type LicenceKind = "listen" | "perform" | "teach";
export type SaleKind = LicenceKind | "choreo";

export const LICENCE_KINDS: Record<LicenceKind, { name: string; rank: number; description: string }> = {
  listen: { name: "Listen", rank: 1, description: "Stream and read full notation" },
  perform: { name: "Perform", rank: 2, description: "One public performance" },
  teach: { name: "Teach", rank: 3, description: "Teach it, incl. in your academy, for 1 year" },
};

export const KIND_ORDER: LicenceKind[] = ["listen", "perform", "teach"];

/** 9 means the person wrote the piece. */
export const OWNER_RANK = 9;

export function rankOfKind(kind: SaleKind): number {
  return kind === "choreo" ? 2 : LICENCE_KINDS[kind].rank;
}

/** Highest rank a set of purchases gives for one composition. */
export function licenceRank(kinds: SaleKind[], isOwner = false): number {
  if (isOwner) return OWNER_RANK;
  return kinds.reduce((r, k) => Math.max(r, rankOfKind(k)), 0);
}

export function rankName(rank: number): string | null {
  if (rank >= OWNER_RANK) return "Your composition";
  if (rank >= 3) return "Teach";
  if (rank >= 2) return "Perform";
  if (rank >= 1) return "Listen";
  return null;
}

export const SPLITS = { composer: 0.8, choreographer: 0.7, composerOfChoreography: 0.15 } as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** One person's share of a sale. */
export function revenueShare(kind: SaleKind, price: number, isSeller: boolean, isComposer: boolean): number {
  if (kind === "choreo") {
    return round2(price * ((isSeller ? SPLITS.choreographer : 0) + (isComposer ? SPLITS.composerOfChoreography : 0)));
  }
  return isSeller || isComposer ? round2(price * SPLITS.composer) : 0;
}

export interface Prices {
  price_listen: number;
  price_perform: number;
  price_teach: number;
}

export function priceOf(c: Prices, kind: LicenceKind): number {
  return Number(kind === "listen" ? c.price_listen : kind === "perform" ? c.price_perform : c.price_teach);
}

/** Cheapest way in, shown on catalogue cards. */
export function fromPrice(c: Prices): number {
  return Math.min(...KIND_ORDER.map((k) => priceOf(c, k)));
}

import { describe, expect, it } from "vitest";
import { fromPrice, licenceRank, rankName, revenueShare, priceOf } from "./licensing";

describe("licence rank", () => {
  it("takes the highest licence held", () => {
    expect(licenceRank([])).toBe(0);
    expect(licenceRank(["listen"])).toBe(1);
    expect(licenceRank(["listen", "teach", "perform"])).toBe(3);
  });
  it("treats a choreography licence as Perform", () => {
    expect(licenceRank(["choreo"])).toBe(2);
    expect(licenceRank(["listen", "choreo"])).toBe(2);
  });
  it("gives the composer everything", () => {
    expect(licenceRank([], true)).toBe(9);
    expect(rankName(9)).toBe("Your composition");
  });
  it("names ranks", () => {
    expect(rankName(0)).toBeNull();
    expect(rankName(1)).toBe("Listen");
    expect(rankName(2)).toBe("Perform");
    expect(rankName(3)).toBe("Teach");
  });
});

describe("revenue share", () => {
  it("pays composers 80% of Listen, Perform and Teach", () => {
    expect(revenueShare("listen", 2, true, true)).toBe(1.6);
    expect(revenueShare("teach", 99, true, true)).toBe(79.2);
    expect(revenueShare("perform", 25, false, false)).toBe(0);
  });
  it("splits choreography 70% to the choreographer and 15% to the composer", () => {
    expect(revenueShare("choreo", 15, true, false)).toBe(10.5);
    expect(revenueShare("choreo", 15, false, true)).toBe(2.25);
    expect(revenueShare("choreo", 100, true, true)).toBe(85);
  });
});

describe("prices", () => {
  const c = { price_listen: 2, price_perform: 25, price_teach: 99 };
  it("reads each kind", () => {
    expect(priceOf(c, "perform")).toBe(25);
  });
  it("shows the cheapest way in", () => {
    expect(fromPrice(c)).toBe(2);
    expect(fromPrice({ price_listen: 30, price_perform: 0, price_teach: 5 })).toBe(0);
  });
});

import { describe, expect, it } from "@jest/globals";

import {
  MAX_DIFFICULTY_LEVEL,
  difficultyStarCount,
} from "@/components/DifficultySelector";

describe("difficultyStarCount", () => {
  it("对应 1~3 星难度", () => {
    expect(difficultyStarCount(0)).toBe(1);
    expect(difficultyStarCount(1)).toBe(2);
    expect(difficultyStarCount(2)).toBe(3);
  });

  it("始终限制在 1~3 星", () => {
    expect(difficultyStarCount(-1)).toBe(1);
    expect(difficultyStarCount(99)).toBe(MAX_DIFFICULTY_LEVEL);
  });
});

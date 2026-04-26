import { describe, it, expect } from "vitest";
import {
  listRecipes,
  getRecipeById,
  listRecipesByFactorySubtype,
  listRecipesByFactorySubtypeAndLevel,
  listDefaultRecipes,
} from "../recipe-query-service";

describe("配方数据完整性", () => {
  it("listRecipes() 应返回 55 条配方", () => {
    expect(listRecipes()).toHaveLength(55);
  });

  it("每条配方应包含 factorySubtypes、unlockCost、requiredLevel、defaultUnlocked 字段", () => {
    for (const recipe of listRecipes()) {
      expect(recipe).toHaveProperty("factorySubtypes");
      expect(recipe).toHaveProperty("unlockCost");
      expect(recipe).toHaveProperty("requiredLevel");
      expect(recipe).toHaveProperty("defaultUnlocked");
    }
  });

  it("每条配方的 unlockCost 应大于 0", () => {
    for (const recipe of listRecipes()) {
      expect(recipe.unlockCost).toBeGreaterThan(0);
    }
  });

  it("每条配方的 requiredLevel 应为 1、2 或 3", () => {
    for (const recipe of listRecipes()) {
      expect([1, 2, 3]).toContain(recipe.requiredLevel);
    }
  });
});

describe("新增配方 buy_water_bulk", () => {
  it("getRecipeById('buy_water_bulk') 应返回高效产水配方", () => {
    expect(getRecipeById("buy_water_bulk")).not.toBeNull();
  });

  it("category 应为 procurement", () => {
    expect(getRecipeById("buy_water_bulk")!.category).toBe("procurement");
  });

  it("inputs 应为 money × 60", () => {
    const recipe = getRecipeById("buy_water_bulk")!;
    expect(recipe.inputs).toEqual([{ itemKey: "money", quantity: 60 }]);
  });

  it("outputs 应为 water × 12", () => {
    const recipe = getRecipeById("buy_water_bulk")!;
    expect(recipe.outputs).toEqual([{ itemKey: "water", quantity: 12 }]);
  });

  it("factorySubtypes 应仅包含 waterworks", () => {
    const recipe = getRecipeById("buy_water_bulk")!;
    expect(recipe.factorySubtypes).toEqual(["waterworks"]);
  });

  it("durationSeconds 应为 10", () => {
    expect(getRecipeById("buy_water_bulk")!.durationSeconds).toBe(10);
  });
});

describe("通用配方标记", () => {
  it("buy_water 的 factorySubtypes 应为 '*'", () => {
    expect(getRecipeById("buy_water")!.factorySubtypes).toBe("*");
  });

  it("非 buy_water 的采购配方 factorySubtypes 不应为 '*'", () => {
    const procurementRecipes = listRecipes().filter(
      (r) => r.category === "procurement" && r.id !== "buy_water",
    );
    for (const recipe of procurementRecipes) {
      expect(recipe.factorySubtypes).not.toBe("*");
    }
  });
});

describe("按工厂子类型筛选", () => {
  function ids(subtype: string) {
    return listRecipesByFactorySubtype(subtype).map((r) => r.id);
  }

  it("mine 应包含矿产采购配方", () => {
    const mineIds = ids("mine");
    for (const id of ["buy_iron_ore", "buy_copper_ore", "buy_coal", "buy_stone", "buy_sand", "buy_clay"]) {
      expect(mineIds).toContain(id);
    }
  });

  it("mine 应包含通用配方 buy_water", () => {
    expect(ids("mine")).toContain("buy_water");
  });

  it("mine 不应包含 buy_wood", () => {
    expect(ids("mine")).not.toContain("buy_wood");
  });

  it("mine 不应包含 buy_cotton", () => {
    expect(ids("mine")).not.toContain("buy_cotton");
  });

  it("waterworks 应仅包含 buy_water 和 buy_water_bulk", () => {
    expect(ids("waterworks").sort()).toEqual(["buy_water", "buy_water_bulk"].sort());
  });

  it("lumber_mill 应包含 buy_wood、saw_wood_plank、burn_charcoal、buy_water", () => {
    const lumberIds = ids("lumber_mill");
    for (const id of ["buy_wood", "saw_wood_plank", "burn_charcoal", "buy_water"]) {
      expect(lumberIds).toContain(id);
    }
  });

  it("smelter 应包含冶炼相关配方", () => {
    const smelterIds = ids("smelter");
    for (const id of ["smelt_iron_ingot", "smelt_copper_ingot", "forge_nails", "forge_steel", "cast_bronze", "buy_water"]) {
      expect(smelterIds).toContain(id);
    }
  });

  it("assembler 不应包含任何 procurement 配方（buy_water 除外）", () => {
    const assemblerRecipes = listRecipesByFactorySubtype("assembler");
    const procurementNonWater = assemblerRecipes.filter(
      (r) => r.category === "procurement" && r.id !== "buy_water",
    );
    expect(procurementNonWater).toHaveLength(0);
  });

  it("textile_mill 应包含纺织相关配方", () => {
    const textileIds = ids("textile_mill");
    for (const id of ["buy_cotton", "buy_flax", "spin_thread", "twist_rope", "woven_cloth", "weave_linen", "weave_fine_cloth", "buy_water"]) {
      expect(textileIds).toContain(id);
    }
  });

  it("ranch 应包含牧场相关配方", () => {
    const ranchIds = ids("ranch");
    for (const id of ["buy_raw_hide", "buy_animal_fat", "tan_leather", "render_tallow", "make_candle", "craft_saddle", "buy_water"]) {
      expect(ranchIds).toContain(id);
    }
  });

  it("apothecary 应包含炼金相关配方", () => {
    const apothecaryIds = ids("apothecary");
    for (const id of ["buy_herbs", "extract_dye", "grind_ink", "brew_medicine", "buy_water"]) {
      expect(apothecaryIds).toContain(id);
    }
  });

  it("carpentry 应包含木工相关配方", () => {
    const carpentryIds = ids("carpentry");
    for (const id of ["saw_wood_plank", "assemble_barrel", "assemble_window", "assemble_furniture", "buy_water"]) {
      expect(carpentryIds).toContain(id);
    }
  });

  it("paper_mill 应包含造纸相关配方", () => {
    const paperIds = ids("paper_mill");
    for (const id of ["pulp_paper", "grind_ink", "bind_books", "buy_water"]) {
      expect(paperIds).toContain(id);
    }
  });
});

describe("按工厂子类型 + 等级筛选", () => {
  function ids(subtype: string, level: number) {
    return listRecipesByFactorySubtypeAndLevel(subtype, level).map((r) => r.id);
  }

  it("mine level=1 应仅返回 requiredLevel ≤ 1 的配方", () => {
    const mineL1 = listRecipesByFactorySubtypeAndLevel("mine", 1);
    for (const recipe of mineL1) {
      expect(recipe.requiredLevel).toBeLessThanOrEqual(1);
    }
  });

  it("mine level=1 不应包含 kiln_brick（需要等级 2）", () => {
    expect(ids("mine", 1)).not.toContain("kiln_brick");
  });

  it("mine level=2 应包含 kiln_brick、calcine_lime、smelt_glass", () => {
    const mineL2 = ids("mine", 2);
    for (const id of ["kiln_brick", "calcine_lime", "smelt_glass"]) {
      expect(mineL2).toContain(id);
    }
  });

  it("mine level=3 应包含 fire_pottery、fire_porcelain、mix_plaster", () => {
    const mineL3 = ids("mine", 3);
    for (const id of ["fire_pottery", "fire_porcelain", "mix_plaster"]) {
      expect(mineL3).toContain(id);
    }
  });

  it("smelter level=1 应包含 smelt_iron_ingot、smelt_copper_ingot、buy_water，不应包含 forge_steel", () => {
    const smelterL1 = ids("smelter", 1);
    expect(smelterL1).toContain("smelt_iron_ingot");
    expect(smelterL1).toContain("smelt_copper_ingot");
    expect(smelterL1).toContain("buy_water");
    expect(smelterL1).not.toContain("forge_steel");
  });

  it("assembler level=1 应仅包含 buy_water", () => {
    expect(ids("assembler", 1)).toEqual(["buy_water"]);
  });
});

describe("默认解锁配方查询", () => {
  function defaultIds(subtype: string) {
    return listDefaultRecipes(subtype).map((r) => r.id).sort();
  }

  it("mine 默认解锁 buy_iron_ore 和 buy_water", () => {
    expect(defaultIds("mine")).toEqual(["buy_iron_ore", "buy_water"]);
  });

  it("lumber_mill 默认解锁 buy_wood 和 buy_water", () => {
    expect(defaultIds("lumber_mill")).toEqual(["buy_water", "buy_wood"]);
  });

  it("textile_mill 默认解锁 buy_cotton 和 buy_water", () => {
    expect(defaultIds("textile_mill")).toEqual(["buy_cotton", "buy_water"]);
  });

  it("ranch 默认解锁 buy_raw_hide 和 buy_water", () => {
    expect(defaultIds("ranch")).toEqual(["buy_raw_hide", "buy_water"]);
  });

  it("apothecary 默认解锁 buy_herbs 和 buy_water", () => {
    expect(defaultIds("apothecary")).toEqual(["buy_herbs", "buy_water"]);
  });

  it("waterworks 默认解锁 buy_water 和 buy_water_bulk", () => {
    expect(defaultIds("waterworks")).toEqual(["buy_water", "buy_water_bulk"]);
  });

  it("smelter 默认解锁 smelt_iron_ingot 和 buy_water", () => {
    expect(defaultIds("smelter")).toEqual(["buy_water", "smelt_iron_ingot"]);
  });

  it("carpentry 默认解锁 saw_wood_plank 和 buy_water", () => {
    expect(defaultIds("carpentry")).toEqual(["buy_water", "saw_wood_plank"]);
  });

  it("paper_mill 默认解锁 pulp_paper 和 buy_water", () => {
    expect(defaultIds("paper_mill")).toEqual(["buy_water", "pulp_paper"]);
  });

  it("assembler 默认仅解锁 buy_water", () => {
    expect(defaultIds("assembler")).toEqual(["buy_water"]);
  });
});

describe("配方解锁费用", () => {
  it("buy_water unlockCost 应为 30", () => {
    expect(getRecipeById("buy_water")!.unlockCost).toBe(30);
  });

  it("buy_iron_ore unlockCost 应为 50（等级 1 采购配方）", () => {
    expect(getRecipeById("buy_iron_ore")!.unlockCost).toBe(50);
  });

  it("smelt_iron_ingot unlockCost 应为 100（等级 1 加工配方）", () => {
    expect(getRecipeById("smelt_iron_ingot")!.unlockCost).toBe(100);
  });

  it("kiln_brick unlockCost 应为 200（等级 2 加工配方）", () => {
    expect(getRecipeById("kiln_brick")!.unlockCost).toBe(200);
  });

  it("forge_tools unlockCost 应为 300（等级 2 组装配方）", () => {
    expect(getRecipeById("forge_tools")!.unlockCost).toBe(300);
  });

  it("fire_porcelain unlockCost 应为 400（等级 3 加工配方）", () => {
    expect(getRecipeById("fire_porcelain")!.unlockCost).toBe(400);
  });

  it("assemble_telescope unlockCost 应为 500（等级 3 组装配方）", () => {
    expect(getRecipeById("assemble_telescope")!.unlockCost).toBe(500);
  });

  it("craft_land_reclamation_badge unlockCost 应为 2000（终极配方）", () => {
    expect(getRecipeById("craft_land_reclamation_badge")!.unlockCost).toBe(2000);
  });
});

describe("共享配方验证", () => {
  it("saw_wood_plank 应同时归属 lumber_mill 和 carpentry", () => {
    const recipe = getRecipeById("saw_wood_plank")!;
    expect(recipe.factorySubtypes).toContain("lumber_mill");
    expect(recipe.factorySubtypes).toContain("carpentry");
  });

  it("grind_ink 应同时归属 apothecary 和 paper_mill", () => {
    const recipe = getRecipeById("grind_ink")!;
    expect(recipe.factorySubtypes).toContain("apothecary");
    expect(recipe.factorySubtypes).toContain("paper_mill");
  });
});

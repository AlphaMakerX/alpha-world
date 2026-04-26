import type { Recipe } from "../value-objects/recipe";

export const processingRecipes: Recipe[] = [
  {
    "id": "saw_wood_plank",
    "name": "木板加工",
    "category": "processing",
    "durationSeconds": 30,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 20
      },
      {
        "itemKey": "wood",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "wood_plank",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "lumber_mill",
      "carpentry"
    ],
    "unlockCost": 100,
    "requiredLevel": 1,
    "defaultUnlocked": [
      "carpentry"
    ]
  },
  {
    "id": "burn_charcoal",
    "name": "烧制木炭",
    "category": "processing",
    "durationSeconds": 35,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 10
      },
      {
        "itemKey": "wood",
        "quantity": 3
      }
    ],
    "outputs": [
      {
        "itemKey": "charcoal",
        "quantity": 2
      }
    ],
    "factorySubtypes": [
      "lumber_mill"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "pulp_paper",
    "name": "造纸",
    "category": "processing",
    "durationSeconds": 40,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 20
      },
      {
        "itemKey": "wood",
        "quantity": 1
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "paper",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "paper_mill"
    ],
    "unlockCost": 100,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "smelt_iron_ingot",
    "name": "冶炼铁锭",
    "category": "processing",
    "durationSeconds": 60,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 40
      },
      {
        "itemKey": "iron_ore",
        "quantity": 3
      },
      {
        "itemKey": "coal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "iron_ingot",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "smelter"
    ],
    "unlockCost": 100,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "smelt_copper_ingot",
    "name": "冶炼铜锭",
    "category": "processing",
    "durationSeconds": 55,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 35
      },
      {
        "itemKey": "copper_ore",
        "quantity": 3
      },
      {
        "itemKey": "coal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "copper_ingot",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "smelter"
    ],
    "unlockCost": 100,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "forge_nails",
    "name": "锻造铁钉",
    "category": "processing",
    "durationSeconds": 25,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 15
      },
      {
        "itemKey": "iron_ingot",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "nails",
        "quantity": 3
      }
    ],
    "factorySubtypes": [
      "smelter"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "forge_steel",
    "name": "锻造钢材",
    "category": "processing",
    "durationSeconds": 70,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 50
      },
      {
        "itemKey": "iron_ingot",
        "quantity": 2
      },
      {
        "itemKey": "charcoal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "steel",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "smelter"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "cast_bronze",
    "name": "铸造青铜",
    "category": "processing",
    "durationSeconds": 65,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 45
      },
      {
        "itemKey": "copper_ingot",
        "quantity": 2
      },
      {
        "itemKey": "iron_ingot",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "bronze",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "smelter"
    ],
    "unlockCost": 400,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "spin_thread",
    "name": "纺丝线",
    "category": "processing",
    "durationSeconds": 30,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 15
      },
      {
        "itemKey": "cotton",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "thread",
        "quantity": 2
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 100,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "woven_cloth",
    "name": "纺织布料",
    "category": "processing",
    "durationSeconds": 45,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 30
      },
      {
        "itemKey": "cotton",
        "quantity": 2
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "cloth",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "weave_linen",
    "name": "纺织亚麻布",
    "category": "processing",
    "durationSeconds": 45,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 30
      },
      {
        "itemKey": "flax",
        "quantity": 2
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "linen",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "twist_rope",
    "name": "搓绳",
    "category": "processing",
    "durationSeconds": 35,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 15
      },
      {
        "itemKey": "flax",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "rope",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 100,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "tan_leather",
    "name": "鞣制皮革",
    "category": "processing",
    "durationSeconds": 50,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 30
      },
      {
        "itemKey": "raw_hide",
        "quantity": 2
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "leather",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "ranch"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "extract_dye",
    "name": "提炼染料",
    "category": "processing",
    "durationSeconds": 40,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 25
      },
      {
        "itemKey": "herbs",
        "quantity": 2
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "dye",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "apothecary"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "weave_fine_cloth",
    "name": "织造锦缎",
    "category": "processing",
    "durationSeconds": 80,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 60
      },
      {
        "itemKey": "cloth",
        "quantity": 2
      },
      {
        "itemKey": "dye",
        "quantity": 1
      },
      {
        "itemKey": "thread",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "fine_cloth",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 400,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "kiln_brick",
    "name": "烧制砖块",
    "category": "processing",
    "durationSeconds": 55,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 25
      },
      {
        "itemKey": "clay",
        "quantity": 2
      },
      {
        "itemKey": "coal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "brick",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "smelt_glass",
    "name": "烧制玻璃",
    "category": "processing",
    "durationSeconds": 50,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 35
      },
      {
        "itemKey": "sand",
        "quantity": 2
      },
      {
        "itemKey": "charcoal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "glass",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "calcine_lime",
    "name": "煅烧石灰",
    "category": "processing",
    "durationSeconds": 45,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 20
      },
      {
        "itemKey": "stone",
        "quantity": 2
      },
      {
        "itemKey": "coal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "lime",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "fire_pottery",
    "name": "烧制陶器",
    "category": "processing",
    "durationSeconds": 55,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 35
      },
      {
        "itemKey": "clay",
        "quantity": 2
      },
      {
        "itemKey": "water",
        "quantity": 1
      },
      {
        "itemKey": "charcoal",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "pottery",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 400,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "fire_porcelain",
    "name": "烧制瓷器",
    "category": "processing",
    "durationSeconds": 80,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 55
      },
      {
        "itemKey": "clay",
        "quantity": 3
      },
      {
        "itemKey": "stone",
        "quantity": 1
      },
      {
        "itemKey": "charcoal",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "porcelain",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 400,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "mix_plaster",
    "name": "调配灰泥",
    "category": "processing",
    "durationSeconds": 40,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 20
      },
      {
        "itemKey": "lime",
        "quantity": 1
      },
      {
        "itemKey": "sand",
        "quantity": 1
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "plaster",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 400,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "render_tallow",
    "name": "熬制油脂",
    "category": "processing",
    "durationSeconds": 30,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 15
      },
      {
        "itemKey": "animal_fat",
        "quantity": 2
      },
      {
        "itemKey": "water",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "tallow",
        "quantity": 2
      }
    ],
    "factorySubtypes": [
      "ranch"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "make_candle",
    "name": "制作蜡烛",
    "category": "processing",
    "durationSeconds": 35,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 15
      },
      {
        "itemKey": "tallow",
        "quantity": 2
      },
      {
        "itemKey": "thread",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "candle",
        "quantity": 2
      }
    ],
    "factorySubtypes": [
      "ranch"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "grind_ink",
    "name": "研制墨水",
    "category": "processing",
    "durationSeconds": 45,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 25
      },
      {
        "itemKey": "charcoal",
        "quantity": 1
      },
      {
        "itemKey": "water",
        "quantity": 1
      },
      {
        "itemKey": "tallow",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "ink",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "apothecary",
      "paper_mill"
    ],
    "unlockCost": 200,
    "requiredLevel": 2,
    "defaultUnlocked": false
  }
];

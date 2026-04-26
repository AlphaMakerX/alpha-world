import type { Recipe } from "../value-objects/recipe";

export const assemblyRecipes: Recipe[] = [
  {
    "id": "assemble_furniture",
    "name": "组装家具",
    "category": "assembly",
    "durationSeconds": 120,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 90
      },
      {
        "itemKey": "wood_plank",
        "quantity": 3
      },
      {
        "itemKey": "cloth",
        "quantity": 1
      },
      {
        "itemKey": "nails",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "furniture",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "carpentry"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_barrel",
    "name": "组装木桶",
    "category": "assembly",
    "durationSeconds": 75,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 55
      },
      {
        "itemKey": "wood_plank",
        "quantity": 2
      },
      {
        "itemKey": "nails",
        "quantity": 2
      },
      {
        "itemKey": "rope",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "barrel",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "carpentry"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_window",
    "name": "组装玻璃窗",
    "category": "assembly",
    "durationSeconds": 85,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 70
      },
      {
        "itemKey": "glass",
        "quantity": 2
      },
      {
        "itemKey": "wood_plank",
        "quantity": 1
      },
      {
        "itemKey": "nails",
        "quantity": 2
      }
    ],
    "outputs": [
      {
        "itemKey": "window",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "carpentry"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "forge_tools",
    "name": "打造工具组",
    "category": "assembly",
    "durationSeconds": 110,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 80
      },
      {
        "itemKey": "steel",
        "quantity": 1
      },
      {
        "itemKey": "wood_plank",
        "quantity": 1
      },
      {
        "itemKey": "leather",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "tools",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_machine_parts",
    "name": "装配机器零件",
    "category": "assembly",
    "durationSeconds": 140,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 120
      },
      {
        "itemKey": "steel",
        "quantity": 2
      },
      {
        "itemKey": "iron_ingot",
        "quantity": 1
      },
      {
        "itemKey": "copper_ingot",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "machine_parts",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "forge_armor",
    "name": "锻造铠甲",
    "category": "assembly",
    "durationSeconds": 160,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 150
      },
      {
        "itemKey": "steel",
        "quantity": 2
      },
      {
        "itemKey": "leather",
        "quantity": 2
      },
      {
        "itemKey": "linen",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "armor",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_compass",
    "name": "组装指南针",
    "category": "assembly",
    "durationSeconds": 95,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 85
      },
      {
        "itemKey": "bronze",
        "quantity": 1
      },
      {
        "itemKey": "glass",
        "quantity": 1
      },
      {
        "itemKey": "iron_ingot",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "compass",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "craft_backpack",
    "name": "缝制背包",
    "category": "assembly",
    "durationSeconds": 100,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 85
      },
      {
        "itemKey": "leather",
        "quantity": 2
      },
      {
        "itemKey": "cloth",
        "quantity": 1
      },
      {
        "itemKey": "rope",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "backpack",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "craft_saddle",
    "name": "缝制马鞍",
    "category": "assembly",
    "durationSeconds": 110,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 100
      },
      {
        "itemKey": "leather",
        "quantity": 3
      },
      {
        "itemKey": "rope",
        "quantity": 1
      },
      {
        "itemKey": "iron_ingot",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "saddle",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "ranch"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_lantern",
    "name": "组装灯笼",
    "category": "assembly",
    "durationSeconds": 80,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 65
      },
      {
        "itemKey": "glass",
        "quantity": 1
      },
      {
        "itemKey": "copper_ingot",
        "quantity": 1
      },
      {
        "itemKey": "candle",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "lantern",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_telescope",
    "name": "组装望远镜",
    "category": "assembly",
    "durationSeconds": 180,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 200
      },
      {
        "itemKey": "glass",
        "quantity": 3
      },
      {
        "itemKey": "bronze",
        "quantity": 2
      },
      {
        "itemKey": "leather",
        "quantity": 1
      },
      {
        "itemKey": "tools",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "telescope",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "assemble_clock",
    "name": "组装钟表",
    "category": "assembly",
    "durationSeconds": 200,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 250
      },
      {
        "itemKey": "bronze",
        "quantity": 2
      },
      {
        "itemKey": "glass",
        "quantity": 1
      },
      {
        "itemKey": "machine_parts",
        "quantity": 1
      },
      {
        "itemKey": "tools",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "clock",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "brew_medicine",
    "name": "调制药品",
    "category": "assembly",
    "durationSeconds": 90,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 80
      },
      {
        "itemKey": "herbs",
        "quantity": 2
      },
      {
        "itemKey": "glass",
        "quantity": 1
      },
      {
        "itemKey": "paper",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "medicine",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "apothecary"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "bind_books",
    "name": "装订书籍",
    "category": "assembly",
    "durationSeconds": 90,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 70
      },
      {
        "itemKey": "paper",
        "quantity": 3
      },
      {
        "itemKey": "leather",
        "quantity": 1
      },
      {
        "itemKey": "ink",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "books",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "paper_mill"
    ],
    "unlockCost": 500,
    "requiredLevel": 3,
    "defaultUnlocked": false
  },
  {
    "id": "carve_sculpture",
    "name": "雕刻雕塑",
    "category": "assembly",
    "durationSeconds": 130,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 95
      },
      {
        "itemKey": "stone",
        "quantity": 3
      },
      {
        "itemKey": "tools",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "sculpture",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "build_reinforced_wall",
    "name": "制作加固墙材",
    "category": "assembly",
    "durationSeconds": 150,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 130
      },
      {
        "itemKey": "brick",
        "quantity": 2
      },
      {
        "itemKey": "steel",
        "quantity": 1
      },
      {
        "itemKey": "plaster",
        "quantity": 1
      },
      {
        "itemKey": "nails",
        "quantity": 3
      }
    ],
    "outputs": [
      {
        "itemKey": "reinforced_wall",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 300,
    "requiredLevel": 2,
    "defaultUnlocked": false
  },
  {
    "id": "craft_land_reclamation_badge",
    "name": "铸造开垦土地徽章",
    "category": "assembly",
    "durationSeconds": 600,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 2000
      },
      {
        "itemKey": "steel",
        "quantity": 8
      },
      {
        "itemKey": "bronze",
        "quantity": 4
      },
      {
        "itemKey": "wood_plank",
        "quantity": 16
      },
      {
        "itemKey": "brick",
        "quantity": 12
      },
      {
        "itemKey": "glass",
        "quantity": 4
      },
      {
        "itemKey": "leather",
        "quantity": 6
      },
      {
        "itemKey": "fine_cloth",
        "quantity": 3
      },
      {
        "itemKey": "porcelain",
        "quantity": 2
      },
      {
        "itemKey": "nails",
        "quantity": 10
      },
      {
        "itemKey": "rope",
        "quantity": 6
      },
      {
        "itemKey": "plaster",
        "quantity": 4
      },
      {
        "itemKey": "tools",
        "quantity": 3
      },
      {
        "itemKey": "machine_parts",
        "quantity": 2
      },
      {
        "itemKey": "reinforced_wall",
        "quantity": 2
      },
      {
        "itemKey": "books",
        "quantity": 2
      },
      {
        "itemKey": "furniture",
        "quantity": 1
      },
      {
        "itemKey": "sculpture",
        "quantity": 1
      }
    ],
    "outputs": [
      {
        "itemKey": "land_reclamation_badge",
        "quantity": 1
      }
    ],
    "factorySubtypes": [
      "assembler"
    ],
    "unlockCost": 2000,
    "requiredLevel": 3,
    "defaultUnlocked": false
  }
];

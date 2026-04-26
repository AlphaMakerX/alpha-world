import type { Recipe } from "../value-objects/recipe";

export const procurementRecipes: Recipe[] = [
  {
    "id": "buy_wood",
    "name": "采购木材",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 80
      }
    ],
    "outputs": [
      {
        "itemKey": "wood",
        "quantity": 8
      }
    ],
    "factorySubtypes": [
      "lumber_mill"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_iron_ore",
    "name": "采购铁矿石",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 100
      }
    ],
    "outputs": [
      {
        "itemKey": "iron_ore",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_copper_ore",
    "name": "采购铜矿石",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 90
      }
    ],
    "outputs": [
      {
        "itemKey": "copper_ore",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "buy_coal",
    "name": "采购煤炭",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 60
      }
    ],
    "outputs": [
      {
        "itemKey": "coal",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "buy_cotton",
    "name": "采购棉花",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 70
      }
    ],
    "outputs": [
      {
        "itemKey": "cotton",
        "quantity": 6
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_flax",
    "name": "采购亚麻",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 70
      }
    ],
    "outputs": [
      {
        "itemKey": "flax",
        "quantity": 6
      }
    ],
    "factorySubtypes": [
      "textile_mill"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "buy_raw_hide",
    "name": "采购生皮",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 80
      }
    ],
    "outputs": [
      {
        "itemKey": "raw_hide",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "ranch"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_animal_fat",
    "name": "采购动物油脂",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 50
      }
    ],
    "outputs": [
      {
        "itemKey": "animal_fat",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "ranch"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "buy_herbs",
    "name": "采购草药",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 90
      }
    ],
    "outputs": [
      {
        "itemKey": "herbs",
        "quantity": 4
      }
    ],
    "factorySubtypes": [
      "apothecary"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_water",
    "name": "采购清水",
    "category": "procurement",
    "durationSeconds": 5,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 30
      }
    ],
    "outputs": [
      {
        "itemKey": "water",
        "quantity": 5
      }
    ],
    "factorySubtypes": "*",
    "unlockCost": 30,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_water_bulk",
    "name": "高效产水",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 60
      }
    ],
    "outputs": [
      {
        "itemKey": "water",
        "quantity": 12
      }
    ],
    "factorySubtypes": [
      "waterworks"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": true
  },
  {
    "id": "buy_stone",
    "name": "采购石料",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 60
      }
    ],
    "outputs": [
      {
        "itemKey": "stone",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "buy_sand",
    "name": "采购砂",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 40
      }
    ],
    "outputs": [
      {
        "itemKey": "sand",
        "quantity": 6
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  },
  {
    "id": "buy_clay",
    "name": "采购黏土",
    "category": "procurement",
    "durationSeconds": 10,
    "inputs": [
      {
        "itemKey": "money",
        "quantity": 50
      }
    ],
    "outputs": [
      {
        "itemKey": "clay",
        "quantity": 5
      }
    ],
    "factorySubtypes": [
      "mine"
    ],
    "unlockCost": 50,
    "requiredLevel": 1,
    "defaultUnlocked": false
  }
];

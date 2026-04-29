# Phase 3：工厂配方解锁与专业化分工（已完成）

通过工厂类型化（10 种）、配方付费解锁、工厂三级升级，打破自给自足，迫使交易协作。186 项测试全通过。

## 核心改动

1. **工厂分 10 种类型**（mine/lumber_mill/textile_mill/ranch/apothecary/waterworks/smelter/carpentry/paper_mill/assembler），建造时选定不可改
2. **配方需购买解锁**：工厂级别，花费金币，幂等不重复扣款
3. **工厂 3 级**：1→2 花 1000，2→3 花 3000
4. **建造后默认解锁** 1-2 个基础配方 + buy_water

## 数据变更

- `plot_buildings` 新增 `subtype`(varchar) + `level`(int, default 1)
- 新表 `factory_unlocked_recipes`：复合主键 (building_id, recipe_id)，CASCADE DELETE
- 配方元数据扩展（静态代码）：`factorySubtypes`、`unlockCost`、`requiredLevel`、`defaultUnlocked`

## 配方分配

| 工厂 | 等级 1 | 等级 2 | 等级 3 |
|------|--------|--------|--------|
| mine | 矿石/煤/石/沙/粘土采购 | 砖/石灰/玻璃 | 陶器/瓷器/石膏 |
| lumber_mill | 木材采购, 木板 | 木炭 | — |
| textile_mill | 棉花/亚麻采购, 线/绳 | 布/亚麻布 | 精纺布 |
| ranch | 生皮/脂肪采购 | 皮革/牛油/蜡烛 | 马鞍 |
| apothecary | 草药采购 | 染料/墨水 | 药品 |
| waterworks | 普通产水+高效产水 | — | — |
| smelter | 铁/铜锭 | 钉子/钢铁 | 青铜 |
| carpentry | 木板 | 桶/窗 | 家具 |
| paper_mill | 纸张 | 墨水 | 书籍 |
| assembler | (仅 buy_water) | 工具/灯/指南针/背包/雕塑/加固墙 | 机械/盔甲/望远镜/钟表/开拓勋章 |

所有工厂共享 buy_water（通用）。共享配方：saw_wood_plank（伐木+木工）、grind_ink（炼金+造纸）。

## 建造费用

600(waterworks) / 800(mine,lumber_mill) / 900(textile_mill,ranch,apothecary) / 1000(smelter,carpentry,paper_mill) / 1200(assembler)

## 解锁费用

30(buy_water) / 50(L1采购) / 100(L1加工) / 200(L2加工) / 300(L2组装) / 400(L3加工) / 500(L3组装) / 2000(终极)

## 新增/改造用例

| 用例 | 说明 |
|------|------|
| unlock-recipe | 类型匹配+等级达标+金币充足 → 扣款写入解锁记录 |
| upgrade-factory | 未达上限+金币充足 → 扣款更新 level |
| start-production（改） | 新增「是否已解锁配方」校验 |
| list-recipes（改） | 按 subtype+level 筛选，标注 unlocked |
| build-building（改） | 需指定 factorySubtype，按子类型计费，自动解锁默认配方 |

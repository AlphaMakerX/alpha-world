## ADDED Requirements

### Requirement: WorldMap shell composes feature concerns

The World Map client SHALL keep a thin composition root component that wires layout (header, map container, modals) to feature-specific hooks or modules, rather than embedding all tRPC queries, mutations, Phaser lifecycle, and player sync logic in a single component file.

#### Scenario: Developer locates domain logic

- **WHEN** a developer needs to change factory listing behavior on the map
- **THEN** they SHALL find the relevant logic in a module or hook scoped to factory/shop/purchasing/plot concerns without reading unrelated Phaser bootstrap code in the same file

### Requirement: Effects and refs for player sync and Phaser are scoped

The client SHALL separate concerns for (a) Phaser game bootstrap and teardown and (b) player position/stamina synchronization with the server (including interval-based updates and scene event emission), so that each `useEffect` or hook documents a single responsibility.

#### Scenario: Reviewing synchronization behavior

- **WHEN** a developer reviews how player position is throttled and synced to the server
- **THEN** they SHALL inspect one dedicated hook or module without parsing Phaser `Game` construction in the same unit

### Requirement: No user-visible behavior regression from composition refactor

Refactoring the World Map client structure MUST NOT change user-visible flows: authentication gating, plot selection, purchase and build, factory production, shop listings and purchases, purchasing station orders, inventory modals, header actions, and map loading states SHALL behave equivalently to the pre-refactor implementation for the same inputs and server responses.

#### Scenario: Authenticated player uses plot modal actions

- **WHEN** an authenticated user opens a plot, purchases land, builds a structure, and uses factory/shop/purchasing station actions supported today
- **THEN** the UI feedback, cache invalidation, and server mutations SHALL match prior behavior

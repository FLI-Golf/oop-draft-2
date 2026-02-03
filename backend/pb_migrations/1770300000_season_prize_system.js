/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const teams = app.findCollectionByNameOrId("teams");
  const tournaments = app.findCollectionByNameOrId("tournaments");

  // --- season_settings ---
  // Stores season-level configuration including prize pool
  const seasonSettings = new Collection({
    type: "base",
    name: "season_settings",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "select",
        name: "season",
        required: true,
        values: ["2026", "2027", "2028", "2029"],
        maxSelect: 1
      },
      {
        type: "number",
        name: "prizePool",
        required: true,
        min: 2000000,
        max: 6000000
      },
      {
        type: "bool",
        name: "distributed",
        required: false
      }
    ]
  });

  app.save(seasonSettings);

  // --- prize_distributions ---
  // Tracks prize money allocated to each team per tournament
  const prizeDistributions = new Collection({
    type: "base",
    name: "prize_distributions",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "relation",
        name: "tournament",
        required: true,
        collectionId: tournaments.id,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "relation",
        name: "team",
        required: true,
        collectionId: teams.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "number",
        name: "position",
        required: true,
        min: 1,
        max: 12,
        noDecimal: true
      },
      {
        type: "number",
        name: "prizeAmount",
        required: true,
        min: 0
      },
      {
        type: "text",
        name: "season",
        required: true,
        max: 4
      }
    ]
  });

  app.save(prizeDistributions);

}, (app) => {
  // rollback
  try {
    const prizeDistributions = app.findCollectionByNameOrId("prize_distributions");
    app.delete(prizeDistributions);
  } catch {}

  try {
    const seasonSettings = app.findCollectionByNameOrId("season_settings");
    app.delete(seasonSettings);
  } catch {}
});

/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const tournaments = app.findCollectionByNameOrId("tournaments");

  // --- tournament_settings ---
  const tournamentSettings = new Collection({
    type: "base",
    name: "tournament_settings",
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
        type: "number",
        name: "startingHole",
        required: true,
        min: 1,
        max: 9,
        noDecimal: true
      },
      {
        type: "number",
        name: "intervalMinutes",
        required: true,
        min: 5,
        max: 30,
        noDecimal: true
      },
      {
        type: "text",
        name: "firstTeeTime",
        required: true,
        max: 5,
        pattern: "^\\d{2}:\\d{2}$"
      },
      {
        type: "select",
        name: "format",
        required: true,
        maxSelect: 1,
        values: ["stroke", "match", "skins", "bestball", "cth", "team_play"]
      }
    ]
  });

  app.save(tournamentSettings);

}, (app) => {
  // rollback
  try {
    const tournamentSettings = app.findCollectionByNameOrId("tournament_settings");
    app.delete(tournamentSettings);
  } catch {}
});

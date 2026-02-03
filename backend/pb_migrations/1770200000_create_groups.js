/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const tournaments = app.findCollectionByNameOrId("tournaments");
  const teams = app.findCollectionByNameOrId("teams");

  // --- groups ---
  // Each group has 2 teams playing together in a tournament.
  // Groups are assigned tee times and starting holes.
  const groups = new Collection({
    type: "base",
    name: "groups",
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
        name: "team1",
        required: true,
        collectionId: teams.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "relation",
        name: "team2",
        required: true,
        collectionId: teams.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "text",
        name: "teeTime",
        required: false,
        max: 5,
        pattern: "^\\d{2}:\\d{2}$"
      },
      {
        type: "number",
        name: "startingHole",
        required: false,
        min: 1,
        max: 9,
        noDecimal: true
      },
      {
        type: "number",
        name: "groupNumber",
        required: false,
        min: 1,
        noDecimal: true
      }
    ]
  });

  app.save(groups);

}, (app) => {
  // rollback
  try {
    const groups = app.findCollectionByNameOrId("groups");
    app.delete(groups);
  } catch {}
});

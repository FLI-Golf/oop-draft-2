/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // --- players (pros) ---
  // Reserve players (is_reserve=true) are not assigned to teams.
  // They fill in when a rostered player is unavailable.
  const players = new Collection({
    type: "base",
    name: "players",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "text",
        name: "name",
        required: true,
        max: 120
      },
      {
        type: "select",
        name: "gender",
        required: true,
        values: ["male", "female"],
        maxSelect: 1
      },
      {
        type: "number",
        name: "rating",
        required: false,
        min: 0,
        max: 1200
      },
      {
        type: "number",
        name: "world_ranking",
        required: false,
        min: 1
      },
      {
        type: "bool",
        name: "active",
        required: false
      },
      {
        type: "bool",
        name: "is_reserve",
        required: false
      },
      {
        type: "email",
        name: "email",
        required: false
      }
    ]
  });

  app.save(players);

  // --- teams ---
  // 12 pro teams, each with 1 male + 1 female player.
  // No reserve teams - reserves are unassigned players.
  const teams = new Collection({
    type: "base",
    name: "teams",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "text",
        name: "name",
        required: true,
        max: 120
      },
      {
        type: "relation",
        name: "malePlayer",
        required: true,
        collectionId: players.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "relation",
        name: "femalePlayer",
        required: true,
        collectionId: players.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "number",
        name: "team_earnings",
        required: false,
        min: 0
      },
      {
        type: "number",
        name: "team_points",
        required: false,
        min: 0
      }
    ]
  });

  app.save(teams);

}, (app) => {
  // rollback
  try {
    const teams = app.findCollectionByNameOrId("teams");
    app.delete(teams);
  } catch {}

  try {
    const players = app.findCollectionByNameOrId("players");
    app.delete(players);
  } catch {}
});

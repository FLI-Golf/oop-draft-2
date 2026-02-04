/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const tournaments = app.findCollectionByNameOrId("tournaments");
  const teams = app.findCollectionByNameOrId("teams");
  const players = app.findCollectionByNameOrId("players");

  // --- playoffs ---
  // Tracks playoff rounds when teams are tied after regulation.
  // Each playoff is a closest-to-hole competition.
  const playoffs = new Collection({
    type: "base",
    name: "playoffs",
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
        name: "playoffRound",
        required: true,
        min: 1,
        max: 10,
        noDecimal: true
      },
      {
        type: "number",
        name: "forPosition",
        required: true,
        min: 1,
        max: 12,
        noDecimal: true
      },
      {
        type: "select",
        name: "status",
        required: false,
        values: ["pending", "in_progress", "complete"],
        maxSelect: 1
      },
      {
        type: "relation",
        name: "winner",
        required: false,
        collectionId: teams.id,
        cascadeDelete: false,
        minSelect: null,
        maxSelect: 1
      }
    ]
  });

  app.save(playoffs);

  // --- playoff_teams ---
  // Teams participating in a specific playoff.
  const playoffTeams = new Collection({
    type: "base",
    name: "playoff_teams",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "relation",
        name: "playoff",
        required: true,
        collectionId: playoffs.id,
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
        name: "tiedScore",
        required: true,
        noDecimal: true
      }
    ]
  });

  app.save(playoffTeams);

  // --- playoff_throws ---
  // Individual throws in a closest-to-hole playoff.
  // Distance is measured in feet (can use decimals for inches).
  const playoffThrows = new Collection({
    type: "base",
    name: "playoff_throws",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "relation",
        name: "playoff",
        required: true,
        collectionId: playoffs.id,
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
        type: "relation",
        name: "player",
        required: true,
        collectionId: players.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      },
      {
        type: "number",
        name: "distanceFeet",
        required: true,
        min: 0,
        max: 500,
        noDecimal: false
      },
      {
        type: "number",
        name: "throwOrder",
        required: true,
        min: 1,
        max: 4,
        noDecimal: true
      }
    ]
  });

  app.save(playoffThrows);

}, (app) => {
  // rollback
  try {
    const playoffThrows = app.findCollectionByNameOrId("playoff_throws");
    app.delete(playoffThrows);
  } catch {}

  try {
    const playoffTeams = app.findCollectionByNameOrId("playoff_teams");
    app.delete(playoffTeams);
  } catch {}

  try {
    const playoffs = app.findCollectionByNameOrId("playoffs");
    app.delete(playoffs);
  } catch {}
});

/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const groups = app.findCollectionByNameOrId("groups");
  const players = app.findCollectionByNameOrId("players");

  // Add status field to groups for scoring workflow
  const groupsCollection = app.findCollectionByNameOrId("groups");
  groupsCollection.fields.add(new Field({
    type: "select",
    name: "status",
    required: false,
    values: ["pending", "in_progress", "complete"],
    maxSelect: 1
  }));
  app.save(groupsCollection);

  // --- scores ---
  // Individual hole scores for each player in a group.
  // 9 holes per round, score relative to par (0 = par, -1 = birdie, +1 = bogey, etc.)
  const scores = new Collection({
    type: "base",
    name: "scores",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "relation",
        name: "group",
        required: true,
        collectionId: groups.id,
        cascadeDelete: true,
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
        name: "hole",
        required: true,
        min: 1,
        max: 18,
        noDecimal: true
      },
      {
        type: "number",
        name: "score",
        required: true,
        min: -3,
        max: 10,
        noDecimal: true
      }
    ]
  });

  app.save(scores);

}, (app) => {
  // rollback
  try {
    const scores = app.findCollectionByNameOrId("scores");
    app.delete(scores);
  } catch {}

  try {
    const groupsCollection = app.findCollectionByNameOrId("groups");
    groupsCollection.fields = groupsCollection.fields.filter(f => f.name !== "status");
    app.save(groupsCollection);
  } catch {}
});

/// <reference path="../pb_data/types.d.ts" />

// Creates the seasons collection that 1770219977_updated_tournaments.js expects
migrate((app) => {
  const seasons = new Collection({
    id: "pbc_134170637",
    type: "base",
    name: "seasons",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        type: "text",
        name: "year",
        required: true,
        max: 4
      },
      {
        type: "bool",
        name: "active",
        required: false
      }
    ]
  });

  app.save(seasons);
}, (app) => {
  try {
    const seasons = app.findCollectionByNameOrId("seasons");
    app.delete(seasons);
  } catch {}
});

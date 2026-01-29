/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // --- courses ---
  const courses = new Collection({
    type: "base",
    name: "courses",
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
        type: "json",
        name: "baseHoleDistances",
        required: true,
        // store the 9 distances array
        maxSize: 5000
      }
    ]
  });

  app.save(courses);

  // --- tournaments ---
  const tournaments = new Collection({
    type: "base",
    name: "tournaments",
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
        type: "date",
        name: "date",
        required: true
      },
      {
        type: "relation",
        name: "course",
        required: true,
        collectionId: courses.id,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1
      }
    ]
  });

  app.save(tournaments);

  // OPTIONAL seed course
  const seed = new Record(courses);
  seed.set("name", "FLI Stadium Course");
  seed.set("baseHoleDistances", [250, 300, 275, 325, 290, 310, 260, 340, 280]);
  app.save(seed);

}, (app) => {
  // rollback
  try {
    const tournaments = app.findCollectionByNameOrId("tournaments");
    app.delete(tournaments);
  } catch {}

  try {
    const courses = app.findCollectionByNameOrId("courses");
    app.delete(courses);
  } catch {}
});

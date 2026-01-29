/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Create "courses" collection
  const courses = new Collection({
    name: "courses",
    type: "base",
    system: false,
    schema: [
      new SchemaField({
        name: "name",
        type: "text",
        required: true,
        options: { min: 1, max: 120, pattern: "" }
      }),
      new SchemaField({
        name: "baseHoleDistances",
        type: "json",
        required: true,
        options: { maxSize: 5000 }
      })
    ],
    indexes: [],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });

  app.save(courses);

  // Create "tournaments" collection
  const tournaments = new Collection({
    name: "tournaments",
    type: "base",
    system: false,
    schema: [
      new SchemaField({
        name: "name",
        type: "text",
        required: true,
        options: { min: 1, max: 120, pattern: "" }
      }),
      new SchemaField({
        name: "date",
        type: "date",
        required: true,
        options: {}
      }),
      new SchemaField({
        name: "course",
        type: "relation",
        required: true,
        options: {
          collectionId: courses.id,
          cascadeDelete: false,
          minSelect: 1,
          maxSelect: 1
        }
      })
    ],
    indexes: [],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });

  app.save(tournaments);

  // OPTIONAL seed course (comment out if you don't want seed data)
  const coursesCol = app.findCollectionByNameOrId("courses");
  const seed = new Record(coursesCol);
  seed.set("name", "FLI Stadium Course");
  seed.set("baseHoleDistances", [250, 300, 275, 325, 290, 310, 260, 340, 280]);
  app.save(seed);

}, (app) => {
  // Rollback
  const tournaments = app.findCollectionByNameOrId("tournaments");
  const courses = app.findCollectionByNameOrId("courses");

  app.delete(tournaments);
  app.delete(courses);
});

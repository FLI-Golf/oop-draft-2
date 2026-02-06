/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("groups");

  // Add stage field for standard vs playoff groups
  collection.fields.addAt(collection.fields.length, new Field({
    type: "select",
    name: "stage",
    required: false,
    values: ["standard", "playoff"],
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("groups");
  
  const stageField = collection.fields.getByName("stage");
  if (stageField) {
    collection.fields.removeById(stageField.id);
  }

  return app.save(collection);
});

/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("tournament_settings");

  // scoringModel (text)
  collection.schema.addField(new SchemaField({
    system: false,
    id: "text_scoringModel_20260204",
    name: "scoringModel",
    type: "text",
    required: false,
    unique: false,
    options: {
      min: 0,
      max: 0,
      pattern: ""
    }
  }));

  // groupSize (number)
  collection.schema.addField(new SchemaField({
    system: false,
    id: "num_groupSize_20260204",
    name: "groupSize",
    type: "number",
    required: false,
    unique: false,
    options: {
      min: null,
      max: null,
      noDecimal: false
    }
  }));

  return dao.saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("tournament_settings");

  collection.schema.removeField("text_scoringModel_20260204");
  collection.schema.removeField("num_groupSize_20260204");

  return dao.saveCollection(collection);
});

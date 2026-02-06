/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select3458517238",
    "maxSelect": 1,
    "name": "scoringModel",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "standard_match_total_strokes",
      "playoff_total_distance",
      "playoff_sudden_death_hole"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select3458517238",
    "maxSelect": 1,
    "name": "scoringModel",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "standard_match_total_strokes",
      "playoff_total_dictance",
      "playoff_sudden_death_hole",
      "none"
    ]
  }))

  return app.save(collection)
})

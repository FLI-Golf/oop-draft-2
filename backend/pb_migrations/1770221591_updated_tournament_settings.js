/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458")

  // remove field
  collection.fields.removeById("text3458517238")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458")

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3458517238",
    "max": 0,
    "min": 0,
    "name": "scoringModel",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})

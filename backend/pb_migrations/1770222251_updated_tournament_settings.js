/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2567666391",
    "max": 4,
    "min": 2,
    "name": "groupSize",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number2567666391",
    "max": 4,
    "min": 2,
    "name": "groupSize",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})

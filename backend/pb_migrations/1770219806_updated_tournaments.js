/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_340646327")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select4041497513",
    "maxSelect": 1,
    "name": "season",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "2026",
      "2027",
      "2028",
      "2029"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_340646327")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select4041497513",
    "maxSelect": 1,
    "name": "season",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "2026",
      "2027",
      "2028",
      "2029"
    ]
  }))

  return app.save(collection)
})

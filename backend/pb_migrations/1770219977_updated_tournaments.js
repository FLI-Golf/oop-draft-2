/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_340646327")

  // remove field
  collection.fields.removeById("select4041497513")

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_134170637",
    "hidden": false,
    "id": "relation2848013514",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "seasonId",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_340646327")

  // add field
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

  // remove field
  collection.fields.removeById("relation2848013514")

  return app.save(collection)
})

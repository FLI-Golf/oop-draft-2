/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1162764458");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_340646327",
        "hidden": false,
        "id": "relation3177167065",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "tournament",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number1089023647",
        "max": 9,
        "min": 1,
        "name": "startingHole",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number228201591",
        "max": 30,
        "min": 5,
        "name": "intervalMinutes",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3023622642",
        "max": 5,
        "min": 0,
        "name": "firstTeeTime",
        "pattern": "^\\d{2}:\\d{2}$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select3736761055",
        "maxSelect": 1,
        "name": "format",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "stroke",
          "match",
          "skins",
          "bestball",
          "cth",
          "team_play"
        ]
      }
    ],
    "id": "pbc_1162764458",
    "indexes": [],
    "listRule": "",
    "name": "tournament_settings",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})

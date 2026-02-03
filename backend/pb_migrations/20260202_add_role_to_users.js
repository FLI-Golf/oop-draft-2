

migrate((app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_");

  // avoid duplicate add if it already exists
  const existing = users.fields.getByName("role");
  if (!existing) {
    users.fields.add(
      new SelectField({
        name: "role",
        required: true,
        presentable: true,
        maxSelect: 1,
        values: ["Admin", "Scorekeeper", "Pro", "Basic User"]
      })
    );

    app.save(users);
  }
}, (app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_");

  const roleField = users.fields.getByName("role");
  if (roleField) {
    users.fields.remove(roleField);
    app.save(users);
  }
});

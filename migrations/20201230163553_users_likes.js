
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('users_likes', function(table) {
      table.integer('users_id');
      table.integer('project_id');
    });    
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users_likes')
};


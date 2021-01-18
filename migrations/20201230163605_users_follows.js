
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('users_follows', function(table) {
      table.integer('users_id');
      table.integer('followers_id');
    });    
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users_follows')
};


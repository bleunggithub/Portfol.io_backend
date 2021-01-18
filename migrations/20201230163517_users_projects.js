
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('users_projects', function(table) {
      table.increments('project_id').primary();
      table.integer('users_id');
      table.string('project_title');
      table.string('project_img_url1');
      table.string('project_img_url2');
      table.string('project_img_url3');
      table.string('project_img_url4');
      table.string('project_img_url5');
      table.string('project_img_url6');
      table.string('project_summary');
      table.string('project_url');
      table.string('project_code_url');
      table.string('project_tags');
    });    
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users_projects')
};

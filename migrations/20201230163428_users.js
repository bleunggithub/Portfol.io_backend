
exports.up = function (knex, Promise) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('email');
      table.string('password');
      table.string('facebook_id');
      table.string('facebook_access_token');
      table.string('google_id');
      table.string('google_access_token');
      table.string('full_name');
      table.string('user_img_url');
      table.string('company');
      table.string('job_title');
      table.string('location');
      table.string('skills');
      table.string('github_url');
      table.string('facebook_url');
      table.string('twitter_url');
      table.string('linkedin_url');
      table.string('website_url');
      table.string('summary',500);
      table.boolean('admin');
      
    });    
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users')
};
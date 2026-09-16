const { Sequelize } = require('sequelize');
const dbConfig = require('./config/config.json');

const sequelize = new Sequelize(
  dbConfig.production.database, 
  dbConfig.production.username, 
  dbConfig.production.password, 
  {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
  }
);

async function run() {
  try {
    const [results] = await sequelize.query("SELECT id, \"imageUrl\" FROM doctors WHERE id = 72");
    console.log(results);
  } catch(e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
run();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('hosta_hospital_db', 'postgres', 'password123', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

async function run() {
  try {
    const [results] = await sequelize.query("SELECT * FROM doctors WHERE id = 72");
    console.log(results);
  } catch(e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
run();

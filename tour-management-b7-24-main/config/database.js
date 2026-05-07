import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, // Tên database
  process.env.DB_USERNAME, // Username
  process.env.DB_PASS, // Password
  {
    host: process.env.DB_HOST,
    dialect: 'mysql'
  }
);

sequelize.authenticate().then(() => {
  console.log('Kết nối database thành công!');
}).catch((error) => {
  console.error('Kết nối database thất bại: ', error);
});

export default sequelize;

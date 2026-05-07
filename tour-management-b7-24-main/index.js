import express from "express";
import dotenv from "dotenv";
dotenv.config();
import sequelize from "./config/database.js";
sequelize;
import bodyParser from "body-parser";
import cors from "cors";

import { clientRoutes } from "./routes/client/index.route.js";
import { adminRoutes } from "./routes/admin/index.route.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(`${__dirname}/public`)); // Thiết lập thư mục chứa file tĩnh

// Cho phép React frontend (port 5173) gọi API
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api", clientRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

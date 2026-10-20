import express from 'express';
import "dotenv/config";

const app = express(); 
const PORT = process.env.PORT;

console.log("DB_URL=",process.env.DB_URL);
app.listen(PORT, () => console.log("Server is set up"));
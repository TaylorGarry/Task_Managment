import "dotenv/config";
import app from "./app.js";
import connectDB from "./DB/connnection.js";

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

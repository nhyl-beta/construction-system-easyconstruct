import app from "../src/app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`✅ Server running → http://localhost:${env.PORT}`);
});
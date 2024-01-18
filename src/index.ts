import dotenv from "dotenv";

import connectDB from "./db/index";
import { app } from "./app";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

    app.on("error", (err) => {
      console.log("Error Occured While Listening! ", err);
      process.exit(1);
    });
  })
  .catch((err) =>
    console.log("Error Occured While Connecting to Database! ", err)
  );

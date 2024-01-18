import mongoose from "mongoose";
import { DB_Name } from "../constants";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_Name}`
    );

    console.log(
      "MONGODB Connection Successful! ",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("MONGODB Connection Failed! ", error);
    process.exit(1);
  }
};

export default connectDB;
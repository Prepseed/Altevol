import { Model, Schema, model, models } from "mongoose";
import UserToken from "../types/UserToken";
import dayjs from "dayjs";
import dbNames from "@/config/dbNames";

const {
  Types: { ObjectId },
} = Schema;

const schema = new Schema<UserToken>({
  user: {
    type: ObjectId,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => dayjs().add(60, "days").toDate(),
  },
});

const UserTokenModel =
  (models[dbNames.userToken] as Model<UserToken>) ||
  model<UserToken>(dbNames.userToken, schema);
export default UserTokenModel;

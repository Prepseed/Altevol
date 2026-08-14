import IUser from "../User";

export default interface UserToken {
  user: IUser;
  token: string;
  expiresAt: Date;
}

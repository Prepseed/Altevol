const mongoose = require("mongoose");

const PHASE_ID = "6a7ed78d63c16db253252f87";

const dummyUsers = [
  {
    name: "Altevol Admin",
    email: "altevol.admin@dummy.local",
    mobileNumber: "9999990001",
    role: "admin",
    uniqueCode: "SRT10-admin-001",
  },
  {
    name: "Altevol User",
    email: "altevol.user@dummy.local",
    mobileNumber: "9999990002",
    role: "user",
    uniqueCode: "SRT10-001",
  },
  {
    name: "Altevol Tennis User",
    email: "altevol.tennis@dummy.local",
    mobileNumber: "9999990004",
    role: "user",
    uniqueCode: "SRT10-002",
  },
];

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.MONGO_MAIN_DB;
  const clientId = process.env.CLIENT;

  if (!mongoUrl || !dbName || !clientId) {
    throw new Error("MONGO_URL, MONGO_MAIN_DB, and CLIENT are required");
  }

  await mongoose.connect(`${mongoUrl}/${dbName}`);
  const users = mongoose.connection.collection("users");
  const client = new mongoose.Types.ObjectId(clientId);
  const phase = new mongoose.Types.ObjectId(PHASE_ID);

  for (const user of dummyUsers) {
    await users.updateOne(
      { email: user.email, client },
      {
        $set: {
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
          uniqueCode: user.uniqueCode,
          username: user.uniqueCode,
          client,
          phases: [phase],
          isActive: true,
          isArchived: false,
          isMobileVerified: true,
          feesPaid: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  const created = await users
    .find({
      uniqueCode: { $in: dummyUsers.map((user) => user.uniqueCode) },
      client,
    })
    .project({
      name: 1,
      role: 1,
      uniqueCode: 1,
      mobileNumber: 1,
      email: 1,
      phases: 1,
      isActive: 1,
    })
    .toArray();

  console.log(JSON.stringify(created, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

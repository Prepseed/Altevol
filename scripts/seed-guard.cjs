const mongoose = require("mongoose");

const PHASE_ID = "6a7ed78d63c16db253252f87";

const guard = {
  name: "Altevol Guard",
  email: "altevol.guard@dummy.local",
  mobileNumber: "9999990003",
  role: "guard",
  uniqueCode: "SRT10-guard-001",
};

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

  await users.updateOne(
    { email: guard.email, client },
    {
      $set: {
        name: guard.name,
        email: guard.email,
        mobileNumber: guard.mobileNumber,
        role: guard.role,
        uniqueCode: guard.uniqueCode,
        username: guard.uniqueCode,
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

  const created = await users.findOne(
    { uniqueCode: guard.uniqueCode, client },
    {
      projection: {
        name: 1,
        role: 1,
        uniqueCode: 1,
        mobileNumber: 1,
        email: 1,
        isActive: 1,
      },
    }
  );

  console.log("Guard login ready:");
  console.log(
    JSON.stringify(
      {
        name: created?.name,
        role: created?.role,
        uniqueCode: created?.uniqueCode,
        mobileNumber: created?.mobileNumber,
        otp: "123456 or 655251",
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

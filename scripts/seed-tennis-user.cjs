const mongoose = require("mongoose");

const PHASE_ID = "6a7ed78d63c16db253252f87";

const tennisUser = {
  name: "Altevol Tennis User",
  email: "altevol.tennis@dummy.local",
  mobileNumber: "9999990004",
  role: "user",
  uniqueCode: "SRT10-002",
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
  const batches = mongoose.connection.collection("altevolBatches");
  const client = new mongoose.Types.ObjectId(clientId);
  const phase = new mongoose.Types.ObjectId(PHASE_ID);

  const tennis1 = await batches.findOne({
    name: "Tennis 1",
    client,
    isArchived: { $ne: true },
  });

  if (!tennis1) {
    throw new Error('Tennis 1 batch not found. Run "npm run seed:batches" first.');
  }

  await users.updateOne(
    { email: tennisUser.email, client },
    {
      $set: {
        name: tennisUser.name,
        email: tennisUser.email,
        mobileNumber: tennisUser.mobileNumber,
        role: tennisUser.role,
        uniqueCode: tennisUser.uniqueCode,
        username: tennisUser.uniqueCode,
        client,
        phases: [phase],
        batch: tennis1._id,
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
    { uniqueCode: tennisUser.uniqueCode, client },
    {
      projection: {
        name: 1,
        role: 1,
        uniqueCode: 1,
        mobileNumber: 1,
        email: 1,
        batch: 1,
        isActive: 1,
      },
    }
  );

  console.log("Tennis 1 user ready:");
  console.log(
    JSON.stringify(
      {
        name: created?.name,
        role: created?.role,
        uniqueCode: created?.uniqueCode,
        mobileNumber: created?.mobileNumber,
        batch: "Tennis 1",
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

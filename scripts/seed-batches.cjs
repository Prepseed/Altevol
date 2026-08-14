const mongoose = require("mongoose");

const PHASE_ID = "6a7ed78d63c16db253252f87";

const batches = [
  { name: "Cricket 1", sport: "cricket", sortOrder: 1, startTime: "06:00", endTime: "08:00" },
  { name: "Cricket 2", sport: "cricket", sortOrder: 2, startTime: "16:00", endTime: "18:00" },
  { name: "Tennis 1", sport: "tennis", sortOrder: 3, startTime: "07:00", endTime: "09:00" },
  { name: "Tennis 2", sport: "tennis", sortOrder: 4, startTime: "17:00", endTime: "19:00" },
];

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.MONGO_MAIN_DB;
  const clientId = process.env.CLIENT;

  if (!mongoUrl || !dbName || !clientId) {
    throw new Error("MONGO_URL, MONGO_MAIN_DB, and CLIENT are required");
  }

  await mongoose.connect(`${mongoUrl}/${dbName}`);
  const collection = mongoose.connection.collection("altevolBatches");
  const users = mongoose.connection.collection("users");
  const client = new mongoose.Types.ObjectId(clientId);

  for (const batch of batches) {
    await collection.updateOne(
      { name: batch.name, client },
      {
        $set: {
          name: batch.name,
          sport: batch.sport,
          startTime: batch.startTime,
          endTime: batch.endTime,
          sortOrder: batch.sortOrder,
          client,
          isArchived: false,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  const cricket1 = await collection.findOne({ name: "Cricket 1", client });
  if (cricket1) {
    await users.updateOne(
      { uniqueCode: "SRT10-001", client },
      { $set: { batch: cricket1._id, updatedAt: new Date() } }
    );
  }

  const tennis1 = await collection.findOne({ name: "Tennis 1", client });
  if (tennis1) {
    await users.updateOne(
      { uniqueCode: "SRT10-002", client, role: "user" },
      { $set: { batch: tennis1._id, updatedAt: new Date() } }
    );
  }

  const created = await collection
    .find({ client, isArchived: false })
    .project({ name: 1, sport: 1, startTime: 1, endTime: 1, sortOrder: 1 })
    .sort({ sortOrder: 1 })
    .toArray();

  const dummyUser = await users.findOne(
    { uniqueCode: "SRT10-001", client },
    { projection: { name: 1, uniqueCode: 1, batch: 1, role: 1 } }
  );

  console.log(JSON.stringify({ batches: created, dummyUser }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

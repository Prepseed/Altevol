const mongoose = require("mongoose");

const PHASE_ID = "6a7ed78d63c16db253252f87";

const family = {
  grandparent: {
    name: "Altevol Grandparent",
    email: "altevol.grandparent@dummy.local",
    mobileNumber: "9999990005",
    role: "grandparent",
    uniqueCode: "SRT10-grandparent-001",
  },
  parent: {
    name: "Altevol Parent",
    email: "altevol.parent@dummy.local",
    mobileNumber: "9999990006",
    role: "parent",
    uniqueCode: "SRT10-parent-001",
  },
  guardian: {
    name: "Altevol Guardian",
    email: "altevol.guardian@dummy.local",
    mobileNumber: "9999990007",
    role: "guardian",
    uniqueCode: "SRT10-guardian-001",
  },
};

async function upsertUser(users, client, phase, user) {
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

  return users.findOne({ uniqueCode: user.uniqueCode, client });
}

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

  const student = await users.findOne({ uniqueCode: "SRT10-001", client });
  if (!student) {
    throw new Error(
      "Cricket 1 student SRT10-001 was not found. Run npm run seed:dummy-users first."
    );
  }

  const grandparent = await upsertUser(users, client, phase, family.grandparent);
  const parent = await upsertUser(users, client, phase, family.parent);
  const guardian = await upsertUser(users, client, phase, family.guardian);

  if (!grandparent || !parent || !guardian) {
    throw new Error("Failed to create family members");
  }

  await users.updateOne(
    { _id: grandparent._id },
    {
      $set: {
        children: [parent._id],
        parentId: null,
        guardianId: null,
        guardianOf: [],
        updatedAt: new Date(),
      },
    }
  );

  await users.updateOne(
    { _id: parent._id },
    {
      $set: {
        parentId: grandparent._id,
        children: [student._id],
        guardianId: null,
        guardianOf: [],
        updatedAt: new Date(),
      },
    }
  );

  await users.updateOne(
    { _id: guardian._id },
    {
      $set: {
        guardianOf: [student._id],
        parentId: null,
        children: [],
        guardianId: null,
        updatedAt: new Date(),
      },
    }
  );

  await users.updateOne(
    { _id: student._id },
    {
      $set: {
        name: "Altevol Student",
        role: "student",
        parentId: parent._id,
        guardianId: guardian._id,
        children: [],
        guardianOf: [],
        updatedAt: new Date(),
      },
    }
  );

  const linked = await users
    .find({
      uniqueCode: {
        $in: [
          "SRT10-grandparent-001",
          "SRT10-parent-001",
          "SRT10-guardian-001",
          "SRT10-001",
        ],
      },
      client,
    })
    .project({
      name: 1,
      role: 1,
      uniqueCode: 1,
      mobileNumber: 1,
      parentId: 1,
      guardianId: 1,
      guardianOf: 1,
      children: 1,
    })
    .toArray();

  console.log("Family hierarchy ready:");
  console.log(JSON.stringify(linked, null, 2));
  console.log("OTP: 123456 or 655251");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

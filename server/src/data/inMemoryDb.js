import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const createId = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const clone = (value) => JSON.parse(JSON.stringify(value));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "persistent-storage.json");

const createEmptyDb = () => ({
  users: [],
  bookings: [],
  subscriptions: [],
  trainerRequests: []
});

const loadDb = () => {
  try {
    if (!fs.existsSync(storagePath)) {
      return createEmptyDb();
    }

    const raw = fs.readFileSync(storagePath, "utf8");
    if (!raw.trim()) {
      return createEmptyDb();
    }

    const parsed = JSON.parse(raw);
    return {
      users: parsed.users ?? [],
      bookings: parsed.bookings ?? [],
      subscriptions: parsed.subscriptions ?? [],
      trainerRequests: parsed.trainerRequests ?? []
    };
  } catch {
    return createEmptyDb();
  }
};

const saveDb = () => {
  fs.writeFileSync(storagePath, JSON.stringify(db, null, 2), "utf8");
};

const applySort = (items, sortConfig = {}) => {
  const [[field, direction]] = Object.entries(sortConfig);
  const factor = direction >= 0 ? 1 : -1;

  return [...items].sort((a, b) => {
    const left = new Date(a[field] ?? 0).getTime();
    const right = new Date(b[field] ?? 0).getTime();
    return (left - right) * factor;
  });
};

const matchQuery = (item, query = {}) =>
  Object.entries(query).every(([key, value]) => item[key]?.toString() === value?.toString());

const omitFields = (item, projection = "") => {
  if (!projection.startsWith("-")) {
    return clone(item);
  }

  const fields = projection
    .split(" ")
    .filter(Boolean)
    .map((field) => field.replace(/^-/, ""));

  const result = clone(item);
  for (const field of fields) {
    delete result[field];
  }
  return result;
};

class FindByIdQuery {
  constructor(executor) {
    this.executor = executor;
  }

  async select(projection) {
    const item = await this.executor();
    return item ? omitFields(item, projection) : null;
  }
}

class FindManyQuery {
  constructor(executor) {
    this.executor = executor;
  }

  sort(sortConfig) {
    return {
      lean: async () => {
        const items = await this.executor();
        return clone(applySort(items, sortConfig));
      }
    };
  }
}

const db = loadDb();

export const inMemoryDb = {
  createUser: async (data) => {
    const now = new Date().toISOString();
    const user = {
      _id: createId(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      phone: data.phone ?? "",
      membership: data.membership ?? "starter",
      role: data.role ?? "member",
      goal: data.goal ?? "Build strength and discipline",
      avatar: data.avatar ?? "",
      joinedAt: data.joinedAt ?? now,
      subscriptionStatus: data.subscriptionStatus ?? "inactive",
      resetPasswordToken: data.resetPasswordToken ?? null,
      resetPasswordExpiresAt: data.resetPasswordExpiresAt ?? null,
      createdAt: now,
      updatedAt: now
    };

    db.users.push(user);
    saveDb();
    return clone(user);
  },
  findUserOne: async (query) => {
    const user = db.users.find((item) => matchQuery(item, query));
    return user ? clone(user) : null;
  },
  findUserById: (id) => new FindByIdQuery(async () => db.users.find((item) => item._id === id) ?? null),
  updateUserById: async (id, update) => {
    const user = db.users.find((item) => item._id === id);
    if (!user) {
      return null;
    }

    Object.assign(user, update, { updatedAt: new Date().toISOString() });
    saveDb();
    return clone(user);
  },
  createBooking: async (data) => {
    const now = new Date().toISOString();
    const booking = {
      _id: createId(),
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
      ...data
    };

    db.bookings.push(booking);
    saveDb();
    return clone(booking);
  },
  findBookingOne: async (query) => {
    const booking = db.bookings.find((item) => matchQuery(item, query));
    return booking ? clone(booking) : null;
  },
  findBookings: (query) => new FindManyQuery(async () => db.bookings.filter((item) => matchQuery(item, query))),
  createSubscription: async (data) => {
    const now = new Date().toISOString();
    const subscription = {
      _id: createId(),
      status: "active",
      startedAt: now,
      createdAt: now,
      updatedAt: now,
      ...data
    };

    db.subscriptions.push(subscription);
    saveDb();
    return clone(subscription);
  },
  findSubscriptions: (query) =>
    new FindManyQuery(async () => db.subscriptions.filter((item) => matchQuery(item, query))),
  createTrainerRequest: async (data) => {
    const now = new Date().toISOString();
    const trainerRequest = {
      _id: createId(),
      status: "pending",
      preferredTime: "Flexible",
      notes: "",
      createdAt: now,
      updatedAt: now,
      ...data
    };

    db.trainerRequests.push(trainerRequest);
    saveDb();
    return clone(trainerRequest);
  },
  findTrainerRequests: (query) =>
    new FindManyQuery(async () => db.trainerRequests.filter((item) => matchQuery(item, query)))
};

// import test from "node:test";
// import assert from "node:assert/strict";
// import * as punchxController from "../Controllers/punchx.controller.js";
// import PunchSession from "../Modals/PunchSession.modal.js";
// import User from "../Modals/User.modal.js";
// import fs from "node:fs";
// import path from "node:path";

// const DAY_MS = 24 * 60 * 60 * 1000;

// const originalPunchSession = {
//   findOne: PunchSession.findOne,
//   find: PunchSession.find,
//   create: PunchSession.create,
// };
// const originalUserFindById = User.findById;
// const originalUserFind = User.find;

// const clone = (obj) => JSON.parse(JSON.stringify(obj));

// const makeSessionDoc = (raw, store) => {
//   const doc = {
//     ...clone(raw),
//     toObject() {
//       return clone(this);
//     },
//     async save() {
//       const idx = store.findIndex((s) => String(s._id) === String(this._id));
//       if (idx >= 0) store[idx] = clone(this);
//       else store.push(clone(this));
//       return this;
//     },
//   };
//   return doc;
// };

// const parseDateKeyStartMs = (dateKey) => Date.parse(`${dateKey}T00:00:00+05:30`);
// const toDateKeyFromMs = (ms) => {
//   const parts = new Intl.DateTimeFormat("en-CA", {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(new Date(ms));
//   const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
//   return `${map.year}-${map.month}-${map.day}`;
// };

// const makeReq = ({ userId = "u1", body = {}, query = {} } = {}) => ({
//   user: { _id: userId, id: userId, roleType: "supervisor", accountType: "supervisor" },
//   body,
//   query,
// });

// const makeRes = () => {
//   const res = {
//     code: null,
//     payload: null,
//     status(code) {
//       this.code = code;
//       return this;
//     },
//     json(payload) {
//       this.payload = payload;
//       return this;
//     },
//     setHeader() {},
//     send(payload) {
//       this.payload = payload;
//       return this;
//     },
//   };
//   return res;
// };

// const withMockedNow = async (isoString, fn) => {
//   const RealDate = global.Date;
//   const fixed = new RealDate(isoString);
//   class MockDate extends RealDate {
//     constructor(...args) {
//       if (args.length === 0) super(fixed.getTime());
//       else super(...args);
//     }
//     static now() {
//       return fixed.getTime();
//     }
//     static parse(v) {
//       return RealDate.parse(v);
//     }
//     static UTC(...args) {
//       return RealDate.UTC(...args);
//     }
//   }
//   global.Date = MockDate;
//   try {
//     return await fn();
//   } finally {
//     global.Date = RealDate;
//   }
// };

// const installModelMocks = ({ sessions, usersById }) => {
//   PunchSession.findOne = (query) => {
//     const matchRows = () => {
//       const dateKey = query?.dateKey;
//       const userId = String(query?.userId || "");
//       return sessions.filter((s) => {
//         if (String(s.userId) !== userId) return false;
//         if (dateKey !== undefined && s.dateKey !== dateKey) return false;
//         if (query?.shiftStartAt?.$ne === null && !s.shiftStartAt) return false;
//         if (query?.shiftEndAt === null && s.shiftEndAt !== null) return false;
//         if (query?.status?.$in && !query.status.$in.includes(s.status)) return false;
//         return true;
//       });
//     };
//     let rows = matchRows();
//     const q = {
//       sort(sortObj) {
//         const [field, dir] = Object.entries(sortObj || {})[0] || [];
//         if (field) {
//           rows = [...rows].sort((a, b) => {
//             const av = new Date(a[field] || 0).getTime();
//             const bv = new Date(b[field] || 0).getTime();
//             return dir < 0 ? bv - av : av - bv;
//           });
//         }
//         return q;
//       },
//       then(resolve) {
//         const first = rows[0] ? makeSessionDoc(rows[0], sessions) : null;
//         return Promise.resolve(first).then(resolve);
//       },
//       catch(reject) {
//         const first = rows[0] ? makeSessionDoc(rows[0], sessions) : null;
//         return Promise.resolve(first).catch(reject);
//       },
//     };
//     return q;
//   };

//   PunchSession.find = (query) => {
//     let rows = sessions.filter((s) => {
//       if (query?.userId?.$in) return query.userId.$in.map(String).includes(String(s.userId));
//       if (query?.userId) return String(s.userId) === String(query.userId);
//       return true;
//     });
//     if (query?.dateKey?.$in) {
//       rows = rows.filter((s) => query.dateKey.$in.includes(s.dateKey));
//     } else if (query?.dateKey) {
//       rows = rows.filter((s) => s.dateKey === query.dateKey);
//     }
//     return {
//       sort(sortObj) {
//         const [field, dir] = Object.entries(sortObj || {})[0] || [];
//         if (field) {
//           rows = [...rows].sort((a, b) => {
//             const av = new Date(a[field] || 0).getTime();
//             const bv = new Date(b[field] || 0).getTime();
//             return dir < 0 ? bv - av : av - bv;
//           });
//         }
//         return Promise.resolve(rows.map((r) => makeSessionDoc(r, sessions)));
//       },
//       then(resolve) {
//         return Promise.resolve(rows.map((r) => makeSessionDoc(r, sessions))).then(resolve);
//       },
//     };
//   };

//   PunchSession.create = async (doc) => {
//     const created = {
//       _id: `sess_${sessions.length + 1}`,
//       userId: doc.userId,
//       dateKey: doc.dateKey,
//       shiftStartAt: doc.shiftStartAt || null,
//       shiftEndAt: doc.shiftEndAt || null,
//       status: doc.status || "not_started",
//       activityStatus: doc.activityStatus || "no_activity",
//       lastActivityAt: doc.lastActivityAt || null,
//       idleWarningAt: null,
//       autoBreakStartedAt: null,
//       totalIdleMs: 0,
//       totalBreakMs: 0,
//       breaks: [],
//       alerts: [],
//       updatedAt: new Date().toISOString(),
//     };
//     sessions.push(clone(created));
//     return makeSessionDoc(created, sessions);
//   };

//   User.findById = (id) => ({
//     select() {
//       return {
//         lean: async () => clone(usersById[String(id)] || null),
//       };
//     },
//   });

//   User.find = (query = {}) => {
//     let rows = Object.values(usersById || {});
//     if (query?._id?.$in) {
//       const ids = query._id.$in.map(String);
//       rows = rows.filter((u) => ids.includes(String(u._id)));
//     }
//     if (query?.accountType?.$in) {
//       rows = rows.filter((u) => query.accountType.$in.includes(u.accountType));
//     }
//     if (query?.reportingManager) {
//       rows = rows.filter((u) => String(u.reportingManager || "") === String(query.reportingManager));
//     }
//     if (query?.department) {
//       rows = rows.filter((u) => String(u.department || "") === String(query.department));
//     }
//     if (query?.isActive?.$ne === false) {
//       rows = rows.filter((u) => u.isActive !== false);
//     }
//     if (query?._id?.$ne) {
//       rows = rows.filter((u) => String(u._id) !== String(query._id.$ne));
//     }

//     const chain = {
//       select() {
//         return {
//           lean: async () => clone(rows),
//         };
//       },
//       lean: async () => clone(rows),
//       then(resolve) {
//         return Promise.resolve(clone(rows)).then(resolve);
//       },
//     };
//     return chain;
//   };
// };

// const restoreModelMocks = () => {
//   PunchSession.findOne = originalPunchSession.findOne;
//   PunchSession.find = originalPunchSession.find;
//   PunchSession.create = originalPunchSession.create;
//   User.findById = originalUserFindById;
//   User.find = originalUserFind;
// };

// test("overnight mapping keeps 4PM-2AM shift on original business date until 3PM cutoff", async () => {
//   const sessions = [];
//   const usersById = { u1: { _id: "u1", shiftStartHour: 16, shiftEndHour: 2, accountType: "employee", isActive: true } };
//   installModelMocks({ sessions, usersById });
//   try {
//     await withMockedNow("2026-05-16T10:30:00+05:30", async () => {
//       const req = makeReq({ userId: "u1" });
//       const res = makeRes();
//       await punchxController.getTodaySession(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.dateKey, "2026-05-15");
//     });
//   } finally {
//     restoreModelMocks();
//   }
// });

// test("midnight shift late login 1AM->2AM is 1 hour only", async () => {
//   const sessions = [
//     {
//       _id: "s1",
//       userId: "u2",
//       dateKey: "2026-05-15",
//       shiftStartAt: "2026-05-15T02:00:00+05:30",
//       shiftEndAt: null,
//       status: "active",
//       activityStatus: "active",
//       lastActivityAt: "2026-05-15T02:00:00+05:30",
//       totalIdleMs: 0,
//       totalBreakMs: 0,
//       breaks: [],
//       alerts: [],
//       updatedAt: "2026-05-15T02:00:00+05:30",
//     },
//   ];
//   const usersById = { sa: { _id: "sa", roleType: "superAdmin", accountType: "superAdmin", isActive: true } };
//   installModelMocks({ sessions, usersById: { ...usersById, u2: { _id: "u2", shiftStartHour: 1, shiftEndHour: 10, accountType: "employee", isActive: true } } });
//   try {
//     await withMockedNow("2026-05-15T03:00:00+05:30", async () => {
//       const req = {
//         user: { _id: "sa", roleType: "superAdmin", accountType: "superAdmin" },
//         query: { dateKey: "2026-05-15" },
//       };
//       const res = makeRes();
//       await punchxController.getSuperAdminDailyStatus(req, res);
//       assert.equal(res.code, 200);
//       const row = res.payload.rows.find((r) => String(r.userId) === "u2");
//       assert.ok(row);
//       assert.equal(row.lateByMs, 60 * 60 * 1000);
//     });
//   } finally {
//     restoreModelMocks();
//   }
// });

// test("re-login continuity reuses same PunchSession in operational window", async () => {
//   const sessions = [
//     {
//       _id: "s1",
//       userId: "u3",
//       dateKey: "2026-05-15",
//       shiftStartAt: "2026-05-15T16:05:00+05:30",
//       shiftEndAt: "2026-05-15T22:00:00+05:30",
//       status: "ended",
//       activityStatus: "no_activity",
//       lastActivityAt: "2026-05-15T22:00:00+05:30",
//       totalIdleMs: 0,
//       totalBreakMs: 0,
//       breaks: [],
//       alerts: [],
//       updatedAt: "2026-05-15T22:00:00+05:30",
//     },
//   ];
//   const usersById = { u3: { _id: "u3", shiftStartHour: 16, shiftEndHour: 2, accountType: "employee", isActive: true } };
//   installModelMocks({ sessions, usersById });
//   try {
//     await withMockedNow("2026-05-16T09:30:00+05:30", async () => {
//       const req = makeReq({ userId: "u3" });
//       const res = makeRes();
//       await punchxController.startShift(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(sessions.length, 1);
//       assert.equal(res.payload.session._id, "s1");
//     });
//   } finally {
//     restoreModelMocks();
//   }
// });

// test("break continuity accumulates across relogin in same session", async () => {
//   const baseDateKey = "2026-05-15";
//   const sessions = [
//     {
//       _id: "s4",
//       userId: "u4",
//       dateKey: baseDateKey,
//       shiftStartAt: "2026-05-15T01:00:00+05:30",
//       shiftEndAt: null,
//       status: "active",
//       activityStatus: "active",
//       lastActivityAt: "2026-05-15T01:00:00+05:30",
//       totalIdleMs: 0,
//       totalBreakMs: 0,
//       breaks: [],
//       alerts: [],
//       updatedAt: "2026-05-15T01:00:00+05:30",
//     },
//   ];
//   const usersById = { u4: { _id: "u4", shiftStartHour: 1, shiftEndHour: 10, accountType: "employee", isActive: true } };
//   installModelMocks({ sessions, usersById });
//   try {
//     await withMockedNow("2026-05-15T02:00:00+05:30", async () => {
//       let req = makeReq({ userId: "u4", body: { type: "manual" } });
//       let res = makeRes();
//       await punchxController.startBreak(req, res);
//       assert.equal(res.code, 200);
//     });
//     await withMockedNow("2026-05-15T02:15:00+05:30", async () => {
//       const req = makeReq({ userId: "u4" });
//       const res = makeRes();
//       await punchxController.endBreak(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.session.totalBreakMs, 15 * 60 * 1000);
//     });
//     await withMockedNow("2026-05-15T08:45:00+05:30", async () => {
//       const req = makeReq({ userId: "u4", body: { type: "manual" } });
//       const res = makeRes();
//       await punchxController.startBreak(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.session._id, "s4");
//     });
//     await withMockedNow("2026-05-15T09:00:00+05:30", async () => {
//       const req = makeReq({ userId: "u4" });
//       const res = makeRes();
//       await punchxController.endBreak(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.session.totalBreakMs, 30 * 60 * 1000);
//       assert.equal(sessions.length, 1);
//     });
//   } finally {
//     restoreModelMocks();
//   }
// });

// test("cross-midnight does not create next-day session before 3PM cutoff", async () => {
//   const sessions = [];
//   const usersById = { u5: { _id: "u5", shiftStartHour: 16, shiftEndHour: 2, accountType: "employee", isActive: true } };
//   installModelMocks({ sessions, usersById });
//   try {
//     await withMockedNow("2026-05-16T01:30:00+05:30", async () => {
//       const req = makeReq({ userId: "u5" });
//       const res = makeRes();
//       await punchxController.getTodaySession(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.dateKey, "2026-05-15");
//       assert.equal(sessions.length, 1);
//       assert.equal(sessions[0].dateKey, "2026-05-15");
//     });
//     await withMockedNow("2026-05-16T10:59:00+05:30", async () => {
//       const req = makeReq({ userId: "u5" });
//       const res = makeRes();
//       await punchxController.getTodaySession(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.dateKey, "2026-05-15");
//       assert.equal(sessions.length, 1);
//     });
//     await withMockedNow("2026-05-16T14:59:00+05:30", async () => {
//       const req = makeReq({ userId: "u5" });
//       const res = makeRes();
//       await punchxController.getTodaySession(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.dateKey, "2026-05-15");
//       assert.equal(sessions.length, 1);
//     });
//     await withMockedNow("2026-05-16T15:01:00+05:30", async () => {
//       const req = makeReq({ userId: "u5" });
//       const res = makeRes();
//       await punchxController.getTodaySession(req, res);
//       assert.equal(res.code, 200);
//       assert.equal(res.payload.dateKey, "2026-05-16");
//     });
//   } finally {
//     restoreModelMocks();
//   }
// });

// test("normal daytime shift regression stays same-day and late works", async () => {
//   const dayKey = "2026-05-16";
//   const sessions = [
//     {
//       _id: "s6",
//       userId: "u6",
//       dateKey: dayKey,
//       shiftStartAt: "2026-05-16T10:30:00+05:30",
//       shiftEndAt: null,
//       status: "active",
//       activityStatus: "active",
//       lastActivityAt: "2026-05-16T10:30:00+05:30",
//       totalIdleMs: 0,
//       totalBreakMs: 0,
//       breaks: [],
//       alerts: [],
//       updatedAt: "2026-05-16T10:30:00+05:30",
//     },
//   ];
//   const usersById = {
//     u6: { _id: "u6", shiftStartHour: 10, shiftEndHour: 19, accountType: "employee", isActive: true },
//     sa2: { _id: "sa2", roleType: "superAdmin", accountType: "superAdmin", isActive: true },
//   };
//   installModelMocks({ sessions, usersById });
//   try {
//     await withMockedNow("2026-05-16T11:00:00+05:30", async () => {
//       const req1 = makeReq({ userId: "u6" });
//       const res1 = makeRes();
//       await punchxController.getTodaySession(req1, res1);
//       assert.equal(res1.code, 200);
//       assert.equal(res1.payload.dateKey, dayKey);

//       const req2 = {
//         user: { _id: "sa2", roleType: "superAdmin", accountType: "superAdmin" },
//         query: { dateKey: dayKey },
//       };
//       const res2 = makeRes();
//       await punchxController.getSuperAdminDailyStatus(req2, res2);
//       assert.equal(res2.code, 200);
//       const row = res2.payload.rows.find((r) => String(r.userId) === "u6");
//       assert.ok(row);
//       assert.equal(row.lateByMs, 30 * 60 * 1000);
//     });
//   } finally {
//     restoreModelMocks();
//   }
// });

// test("frontend no longer contains duplicate business-day rollover logic", async () => {
//   const filePath = path.resolve(process.cwd(), "../Client/src/pages/SuperAdminLoginStatus.jsx");
//   const source = fs.readFileSync(filePath, "utf-8");
//   assert.equal(source.includes("getISTBusinessDateKey"), false);
//   assert.equal(source.includes("getBusinessDateKeyFromISTTimestamp"), false);
//   assert.equal(source.includes("isNightShiftRow"), false);
// });




import test from "node:test";
import assert from "node:assert/strict";
import * as punchxController from "../Controllers/punchx.controller.js";
import PunchSession from "../Modals/PunchSession.modal.js";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";
import fs from "node:fs";
import path from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;

const originalPunchSession = {
  findOne: PunchSession.findOne,
  find: PunchSession.find,
  create: PunchSession.create,
};
const originalRosterFind = Roster.find;
const originalUserFindById = User.findById;
const originalUserFind = User.find;

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const makeSessionDoc = (raw, store) => {
  const doc = {
    ...clone(raw),
    toObject() {
      return clone(this);
    },
    async save() {
      const idx = store.findIndex((s) => String(s._id) === String(this._id));
      if (idx >= 0) store[idx] = clone(this);
      else store.push(clone(this));
      return this;
    },
  };
  return doc;
};

const parseDateKeyStartMs = (dateKey) => Date.parse(`${dateKey}T00:00:00+05:30`);
const toDateKeyFromMs = (ms) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const makeReq = ({ userId = "u1", body = {}, query = {} } = {}) => ({
  user: { _id: userId, id: userId, roleType: "supervisor", accountType: "supervisor" },
  body,
  query,
});

const makeRes = () => {
  const res = {
    code: null,
    payload: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    setHeader() {},
    send(payload) {
      this.payload = payload;
      return this;
    },
  };
  return res;
};

const withMockedNow = async (isoString, fn) => {
  const RealDate = global.Date;
  const fixed = new RealDate(isoString);
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixed.getTime());
      else super(...args);
    }
    static now() {
      return fixed.getTime();
    }
    static parse(v) {
      return RealDate.parse(v);
    }
    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  }
  global.Date = MockDate;
  try {
    return await fn();
  } finally {
    global.Date = RealDate;
  }
};

const installModelMocks = ({ sessions, usersById, rosters = [] }) => {
  PunchSession.findOne = (query) => {
    const matchRows = () => {
      const dateKey = query?.dateKey;
      const userId = String(query?.userId || "");
      return sessions.filter((s) => {
        if (String(s.userId) !== userId) return false;
        if (dateKey !== undefined && s.dateKey !== dateKey) return false;
        if (query?.shiftStartAt?.$ne === null && !s.shiftStartAt) return false;
        if (query?.shiftEndAt === null && s.shiftEndAt !== null) return false;
        if (query?.status?.$in && !query.status.$in.includes(s.status)) return false;
        return true;
      });
    };
    let rows = matchRows();
    const q = {
      sort(sortObj) {
        const [field, dir] = Object.entries(sortObj || {})[0] || [];
        if (field) {
          rows = [...rows].sort((a, b) => {
            const av = new Date(a[field] || 0).getTime();
            const bv = new Date(b[field] || 0).getTime();
            return dir < 0 ? bv - av : av - bv;
          });
        }
        return q;
      },
      then(resolve) {
        const first = rows[0] ? makeSessionDoc(rows[0], sessions) : null;
        return Promise.resolve(first).then(resolve);
      },
      catch(reject) {
        const first = rows[0] ? makeSessionDoc(rows[0], sessions) : null;
        return Promise.resolve(first).catch(reject);
      },
    };
    return q;
  };

  PunchSession.find = (query) => {
    let rows = sessions.filter((s) => {
      if (query?.userId?.$in) return query.userId.$in.map(String).includes(String(s.userId));
      if (query?.userId) return String(s.userId) === String(query.userId);
      return true;
    });
    if (query?.dateKey?.$in) {
      rows = rows.filter((s) => query.dateKey.$in.includes(s.dateKey));
    } else if (query?.dateKey) {
      rows = rows.filter((s) => s.dateKey === query.dateKey);
    }
    return {
      sort(sortObj) {
        const [field, dir] = Object.entries(sortObj || {})[0] || [];
        if (field) {
          rows = [...rows].sort((a, b) => {
            const av = new Date(a[field] || 0).getTime();
            const bv = new Date(b[field] || 0).getTime();
            return dir < 0 ? bv - av : av - bv;
          });
        }
        return Promise.resolve(rows.map((r) => makeSessionDoc(r, sessions)));
      },
      then(resolve) {
        return Promise.resolve(rows.map((r) => makeSessionDoc(r, sessions))).then(resolve);
      },
    };
  };

  PunchSession.create = async (doc) => {
    const created = {
      _id: `sess_${sessions.length + 1}`,
      userId: doc.userId,
      dateKey: doc.dateKey,
      shiftStartAt: doc.shiftStartAt || null,
      shiftEndAt: doc.shiftEndAt || null,
      status: doc.status || "not_started",
      activityStatus: doc.activityStatus || "no_activity",
      lastActivityAt: doc.lastActivityAt || null,
      idleWarningAt: null,
      autoBreakStartedAt: null,
      totalIdleMs: 0,
      totalBreakMs: 0,
      breaks: [],
      alerts: [],
      updatedAt: new Date().toISOString(),
    };
    sessions.push(clone(created));
    return makeSessionDoc(created, sessions);
  };

  Roster.find = () => ({
    select() {
      return {
        lean: async () => clone(rosters),
      };
    },
    lean: async () => clone(rosters),
    then(resolve) {
      return Promise.resolve(clone(rosters)).then(resolve);
    },
  });

  User.findById = (id) => ({
    select() {
      return {
        lean: async () => clone(usersById[String(id)] || null),
      };
    },
  });

  User.find = (query = {}) => {
    let rows = Object.values(usersById || {});
    if (query?._id?.$in) {
      const ids = query._id.$in.map(String);
      rows = rows.filter((u) => ids.includes(String(u._id)));
    }
    if (query?.accountType?.$in) {
      rows = rows.filter((u) => query.accountType.$in.includes(u.accountType));
    }
    if (query?.reportingManager) {
      rows = rows.filter((u) => String(u.reportingManager || "") === String(query.reportingManager));
    }
    if (query?.department) {
      rows = rows.filter((u) => String(u.department || "") === String(query.department));
    }
    if (query?.isActive?.$ne === false) {
      rows = rows.filter((u) => u.isActive !== false);
    }
    if (query?._id?.$ne) {
      rows = rows.filter((u) => String(u._id) !== String(query._id.$ne));
    }

    const chain = {
      select() {
        return {
          lean: async () => clone(rows),
        };
      },
      lean: async () => clone(rows),
      then(resolve) {
        return Promise.resolve(clone(rows)).then(resolve);
      },
    };
    return chain;
  };
};

const restoreModelMocks = () => {
  PunchSession.findOne = originalPunchSession.findOne;
  PunchSession.find = originalPunchSession.find;
  PunchSession.create = originalPunchSession.create;
  Roster.find = originalRosterFind;
  User.findById = originalUserFindById;
  User.find = originalUserFind;
};

test("overnight mapping keeps 4PM-2AM shift on original business date until 3PM cutoff", async () => {
  const sessions = [];
  const usersById = { u1: { _id: "u1", shiftStartHour: 16, shiftEndHour: 2, accountType: "employee", isActive: true } };
  installModelMocks({ sessions, usersById });
  try {
    await withMockedNow("2026-05-16T10:30:00+05:30", async () => {
      const req = makeReq({ userId: "u1" });
      const res = makeRes();
      await punchxController.getTodaySession(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.dateKey, "2026-05-15");
    });
  } finally {
    restoreModelMocks();
  }
});

test("midnight shift late login 1AM->2AM is 1 hour only", async () => {
  const sessions = [
    {
      _id: "s1",
      userId: "u2",
      dateKey: "2026-05-15",
      shiftStartAt: "2026-05-15T02:00:00+05:30",
      shiftEndAt: null,
      status: "active",
      activityStatus: "active",
      lastActivityAt: "2026-05-15T02:00:00+05:30",
      totalIdleMs: 0,
      totalBreakMs: 0,
      breaks: [],
      alerts: [],
      updatedAt: "2026-05-15T02:00:00+05:30",
    },
  ];
  const usersById = { sa: { _id: "sa", roleType: "superAdmin", accountType: "superAdmin", isActive: true } };
  installModelMocks({ sessions, usersById: { ...usersById, u2: { _id: "u2", shiftStartHour: 1, shiftEndHour: 10, accountType: "employee", isActive: true } } });
  try {
    await withMockedNow("2026-05-15T03:00:00+05:30", async () => {
      const req = {
        user: { _id: "sa", roleType: "superAdmin", accountType: "superAdmin" },
        query: { dateKey: "2026-05-15" },
      };
      const res = makeRes();
      await punchxController.getSuperAdminDailyStatus(req, res);
      assert.equal(res.code, 200);
      const row = res.payload.rows.find((r) => String(r.userId) === "u2");
      assert.ok(row);
      assert.equal(row.lateByMs, 60 * 60 * 1000);
    });
  } finally {
    restoreModelMocks();
  }
});

test("re-login continuity reuses same PunchSession in operational window", async () => {
  const sessions = [
    {
      _id: "s1",
      userId: "u3",
      dateKey: "2026-05-15",
      shiftStartAt: "2026-05-15T16:05:00+05:30",
      shiftEndAt: "2026-05-15T22:00:00+05:30",
      status: "ended",
      activityStatus: "no_activity",
      lastActivityAt: "2026-05-15T22:00:00+05:30",
      totalIdleMs: 0,
      totalBreakMs: 0,
      breaks: [],
      alerts: [],
      updatedAt: "2026-05-15T22:00:00+05:30",
    },
  ];
  const usersById = { u3: { _id: "u3", shiftStartHour: 16, shiftEndHour: 2, accountType: "employee", isActive: true } };
  installModelMocks({ sessions, usersById });
  try {
    await withMockedNow("2026-05-16T09:30:00+05:30", async () => {
      const req = makeReq({ userId: "u3" });
      const res = makeRes();
      await punchxController.startShift(req, res);
      assert.equal(res.code, 200);
      assert.equal(sessions.length, 1);
      assert.equal(res.payload.session._id, "s1");
    });
  } finally {
    restoreModelMocks();
  }
});

test("break continuity accumulates across relogin in same session", async () => {
  const baseDateKey = "2026-05-15";
  const sessions = [
    {
      _id: "s4",
      userId: "u4",
      dateKey: baseDateKey,
      shiftStartAt: "2026-05-15T01:00:00+05:30",
      shiftEndAt: null,
      status: "active",
      activityStatus: "active",
      lastActivityAt: "2026-05-15T01:00:00+05:30",
      totalIdleMs: 0,
      totalBreakMs: 0,
      breaks: [],
      alerts: [],
      updatedAt: "2026-05-15T01:00:00+05:30",
    },
  ];
  const usersById = { u4: { _id: "u4", shiftStartHour: 1, shiftEndHour: 10, accountType: "employee", isActive: true } };
  installModelMocks({ sessions, usersById });
  try {
    await withMockedNow("2026-05-15T02:00:00+05:30", async () => {
      let req = makeReq({ userId: "u4", body: { type: "manual" } });
      let res = makeRes();
      await punchxController.startBreak(req, res);
      assert.equal(res.code, 200);
    });
    await withMockedNow("2026-05-15T02:15:00+05:30", async () => {
      const req = makeReq({ userId: "u4" });
      const res = makeRes();
      await punchxController.endBreak(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.session.totalBreakMs, 15 * 60 * 1000);
    });
    await withMockedNow("2026-05-15T08:45:00+05:30", async () => {
      const req = makeReq({ userId: "u4", body: { type: "manual" } });
      const res = makeRes();
      await punchxController.startBreak(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.session._id, "s4");
    });
    await withMockedNow("2026-05-15T09:00:00+05:30", async () => {
      const req = makeReq({ userId: "u4" });
      const res = makeRes();
      await punchxController.endBreak(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.session.totalBreakMs, 30 * 60 * 1000);
      assert.equal(sessions.length, 1);
    });
  } finally {
    restoreModelMocks();
  }
});

test("cross-midnight does not create next-day session before 3PM cutoff", async () => {
  const sessions = [];
  const usersById = { u5: { _id: "u5", shiftStartHour: 16, shiftEndHour: 2, accountType: "employee", isActive: true } };
  installModelMocks({ sessions, usersById });
  try {
    await withMockedNow("2026-05-16T01:30:00+05:30", async () => {
      const req = makeReq({ userId: "u5" });
      const res = makeRes();
      await punchxController.getTodaySession(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.dateKey, "2026-05-15");
      assert.equal(sessions.length, 1);
      assert.equal(sessions[0].dateKey, "2026-05-15");
    });
    await withMockedNow("2026-05-16T10:59:00+05:30", async () => {
      const req = makeReq({ userId: "u5" });
      const res = makeRes();
      await punchxController.getTodaySession(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.dateKey, "2026-05-15");
      assert.equal(sessions.length, 1);
    });
    await withMockedNow("2026-05-16T14:59:00+05:30", async () => {
      const req = makeReq({ userId: "u5" });
      const res = makeRes();
      await punchxController.getTodaySession(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.dateKey, "2026-05-15");
      assert.equal(sessions.length, 1);
    });
    await withMockedNow("2026-05-16T15:01:00+05:30", async () => {
      const req = makeReq({ userId: "u5" });
      const res = makeRes();
      await punchxController.getTodaySession(req, res);
      assert.equal(res.code, 200);
      assert.equal(res.payload.dateKey, "2026-05-16");
    });
  } finally {
    restoreModelMocks();
  }
});

test("normal daytime shift regression stays same-day and late works", async () => {
  const dayKey = "2026-05-16";
  const sessions = [
    {
      _id: "s6",
      userId: "u6",
      dateKey: dayKey,
      shiftStartAt: "2026-05-16T10:30:00+05:30",
      shiftEndAt: null,
      status: "active",
      activityStatus: "active",
      lastActivityAt: "2026-05-16T10:30:00+05:30",
      totalIdleMs: 0,
      totalBreakMs: 0,
      breaks: [],
      alerts: [],
      updatedAt: "2026-05-16T10:30:00+05:30",
    },
  ];
  const usersById = {
    u6: { _id: "u6", shiftStartHour: 10, shiftEndHour: 19, accountType: "employee", isActive: true },
    sa2: { _id: "sa2", roleType: "superAdmin", accountType: "superAdmin", isActive: true },
  };
  installModelMocks({ sessions, usersById });
  try {
    await withMockedNow("2026-05-16T11:00:00+05:30", async () => {
      const req1 = makeReq({ userId: "u6" });
      const res1 = makeRes();
      await punchxController.getTodaySession(req1, res1);
      assert.equal(res1.code, 200);
      assert.equal(res1.payload.dateKey, dayKey);

      const req2 = {
        user: { _id: "sa2", roleType: "superAdmin", accountType: "superAdmin" },
        query: { dateKey: dayKey },
      };
      const res2 = makeRes();
      await punchxController.getSuperAdminDailyStatus(req2, res2);
      assert.equal(res2.code, 200);
      const row = res2.payload.rows.find((r) => String(r.userId) === "u6");
      assert.ok(row);
      assert.equal(row.lateByMs, 30 * 60 * 1000);
    });
  } finally {
    restoreModelMocks();
  }
});

test("superadmin daily status includes roster present count for selected date", async () => {
  const dayKey = "2026-05-20";
  const sessions = [
    {
      _id: "s7",
      userId: "u7",
      dateKey: dayKey,
      shiftStartAt: "2026-05-20T10:00:00+05:30",
      shiftEndAt: null,
      status: "active",
      activityStatus: "active",
      lastActivityAt: "2026-05-20T10:00:00+05:30",
      totalIdleMs: 0,
      totalBreakMs: 0,
      breaks: [],
      alerts: [],
      updatedAt: "2026-05-20T10:00:00+05:30",
    },
  ];
  const rosters = [
    {
      weeks: [
        {
          startDate: "2026-05-18T00:00:00+05:30",
          endDate: "2026-05-24T23:59:59+05:30",
          employees: [
            {
              userId: null,
              empId: "EMP007",
              name: "Agent Seven",
              dailyStatus: [{ date: "2026-05-20T00:00:00+05:30", status: "" }],
            },
            {
              userId: null,
              empId: "EMP008",
              name: "Agent Eight",
              dailyStatus: [{ date: "2026-05-20T00:00:00+05:30", status: "WO" }],
            },
          ],
        },
      ],
    },
  ];
  const usersById = {
    u7: { _id: "u7", empId: "EMP007", pseudoName: "Agent Seven", shiftStartHour: 10, shiftEndHour: 19, accountType: "employee", isActive: true },
    u8: { _id: "u8", empId: "EMP008", pseudoName: "Agent Eight", shiftStartHour: 10, shiftEndHour: 19, accountType: "employee", isActive: true },
    sa3: { _id: "sa3", roleType: "superAdmin", accountType: "superAdmin", isActive: true },
  };
  installModelMocks({ sessions, usersById, rosters });
  try {
    const req = {
      user: { _id: "sa3", roleType: "superAdmin", accountType: "superAdmin" },
      query: { dateKey: dayKey },
    };
    const res = makeRes();
    await punchxController.getSuperAdminDailyStatus(req, res);
    assert.equal(res.code, 200);
    assert.equal(res.payload.summary.presentCount, 1);
  } finally {
    restoreModelMocks();
  }
});

test("frontend no longer contains duplicate business-day rollover logic", async () => {
  const filePath = path.resolve(process.cwd(), "../Client/src/pages/SuperAdminLoginStatus.jsx");
  const source = fs.readFileSync(filePath, "utf-8");
  assert.equal(source.includes("getISTBusinessDateKey"), false);
  assert.equal(source.includes("getBusinessDateKeyFromISTTimestamp"), false);
  assert.equal(source.includes("isNightShiftRow"), false);
});

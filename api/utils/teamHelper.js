import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";

const normalize = (value = "") => String(value || "").trim().toLowerCase();
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const normalizeLabel = (value = "") =>
  normalize(value)
    .replace(/[()\-_/.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value);
  if (typeof value === "string" && DATE_ONLY_RE.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const local = new Date(y, m - 1, d, 0, 0, 0, 0);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDayRange = (dateValue) => {
  const d = parseDate(dateValue) || new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && aEnd >= bStart;

const getRostersForDate = async (dateValue) => {
  const { start, end } = getDayRange(dateValue);

  let rosters = await Roster.find({
    $or: [
      {
        rosterStartDate: { $lte: end },
        rosterEndDate: { $gte: start },
      },
      {
        weeks: {
          $elemMatch: {
            startDate: { $lte: end },
            endDate: { $gte: start },
          },
        },
      },
    ],
  })
    .sort({ rosterStartDate: -1, rosterEndDate: -1, year: -1, month: -1 })
    .lean();

  if (!rosters.length) {
    const latest = await Roster.findOne().sort({ rosterStartDate: -1, rosterEndDate: -1, year: -1, month: -1 }).lean();
    rosters = latest ? [latest] : [];
  }

  return { rosters, start, end };
};

const getWeeksForDate = (rosters, dayStart, dayEnd) => {
  const weeks = [];
  for (const roster of rosters || []) {
    for (const week of roster.weeks || []) {
      const ws = parseDate(week?.startDate);
      const we = parseDate(week?.endDate);
      if (!ws || !we) continue;
      if (overlaps(ws, we, dayStart, dayEnd)) {
        weeks.push(week);
      }
    }
  }
  return weeks;
};

export const getTeamMembersByTeamLeader = async (teamLeaderId, date = null) => {
  try {
    const teamLeader = await User.findById(teamLeaderId).lean();
    if (!teamLeader) return [];

    const tlAliases = new Set(
      [
        teamLeader?.username,
        teamLeader?.realName,
        teamLeader?.pseudoName,
        `${teamLeader?.username || ""} ${teamLeader?.department || ""}`,
        `${teamLeader?.realName || ""} ${teamLeader?.department || ""}`,
      ]
        .map(normalizeLabel)
        .filter(Boolean)
    );
    if (!tlAliases.size) return [];

    const { rosters, start, end } = await getRostersForDate(date);
    if (!rosters.length) return [];

    const weeks = getWeeksForDate(rosters, start, end);
    if (!weeks.length) return [];

    const matched = [];
    const seen = new Set();

    for (const week of weeks) {
      for (const employee of week.employees || []) {
        if (!employee) continue;
        const empTl = normalizeLabel(employee.teamLeader || "");
        if (!empTl) continue;

        const matchesAlias = Array.from(tlAliases).some((alias) => {
          if (empTl === alias) return true;
          if (empTl.includes(alias) || alias.includes(empTl)) return true;
          return false;
        });
        if (!matchesAlias) continue;

        const empName = normalizeLabel(employee.name || "");
        const isSelf = Array.from(tlAliases).some((alias) => empName && (empName === alias || empName.includes(alias)));
        if (isSelf) continue;

        const key = employee.userId ? `uid:${String(employee.userId)}` : `name:${normalize(employee.name)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matched.push(employee);
      }
    }

    if (!matched.length) return [];

    const userIds = matched.map((e) => (e.userId ? String(e.userId) : "")).filter(Boolean);
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select("username department _id").lean()
      : [];
    const usersById = new Map(users.map((u) => [String(u._id), u]));

    return matched.map((employee) => {
      const user = employee.userId ? usersById.get(String(employee.userId)) : null;
      return {
        userId: user?._id || employee.userId || null,
        name: employee.name,
        username: user?.username || employee.name,
        department: user?.department || employee.department || "N/A",
        shiftStartHour: employee.shiftStartHour,
        shiftEndHour: employee.shiftEndHour,
        teamLeader: employee.teamLeader || "",
      };
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

export const getAllTeamLeaders = async (date = null) => {
  try {
    const { rosters, start, end } = await getRostersForDate(date);
    if (!rosters.length) {
      return await User.find({}).select("username department _id").limit(100).lean();
    }

    const weeks = getWeeksForDate(rosters, start, end);
    const leaderNames = new Set();
    for (const week of weeks) {
      for (const employee of week.employees || []) {
        const name = String(employee?.teamLeader || "").trim();
        if (name) leaderNames.add(name);
      }
    }

    if (!leaderNames.size) {
      return await User.find({}).select("username department _id").limit(100).lean();
    }

    const leaders = [];
    for (const tlName of leaderNames) {
      const exact = String(tlName || "").trim();
      const user = await User.findOne({
        $or: [
          { username: { $regex: `^${exact}$`, $options: "i" } },
          { realName: { $regex: `^${exact}$`, $options: "i" } },
          { pseudoName: { $regex: `^${exact}$`, $options: "i" } },
        ],
      })
        .select("username department _id")
        .lean();
      if (user) {
        leaders.push(user);
      } else {
        leaders.push({
          _id: `temp_${tlName}`,
          username: tlName,
          department: "Unknown",
        });
      }
    }
    return leaders;
  } catch (error) {
    console.error("Error fetching team leaders:", error);
    return await User.find({}).select("username department _id").limit(100).lean();
  }
};

export const isUserTeamLeader = async (userId) => {
  try {
    const user = await User.findById(userId).lean();
    if (!user) return false;
    const members = await getTeamMembersByTeamLeader(user._id, new Date());
    return members.length > 0;
  } catch (error) {
    console.error("Error checking team leader status:", error);
    return false;
  }
};

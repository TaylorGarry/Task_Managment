// utils/teamHelper.js
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";

// Get all employees under a team leader (based on teamLeader string field)
export const getTeamMembersByTeamLeader = async (teamLeaderId, date = null) => {
  try {
    console.log("=== getTeamMembersByTeamLeader ===");
    console.log("TeamLeaderId:", teamLeaderId);
    
    // Get the team leader's user details to get their username
    const teamLeader = await User.findById(teamLeaderId);
    if (!teamLeader) {
      console.log("❌ Team leader not found for ID:", teamLeaderId);
      return [];
    }
    
    const teamLeaderUsername = teamLeader.username;
    console.log("✅ Team leader found:", teamLeaderUsername);
    console.log("Looking for employees with teamLeader =", teamLeaderUsername);
    
    const targetDate = date || new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    
    console.log("Looking for roster with month:", month, "year:", year);
    
    // Find roster for current month
    let roster = await Roster.findOne({ month, year });
    
    // If no roster for current month, find the latest roster
    if (!roster) {
      console.log(`No roster found for ${month}/${year}, looking for latest...`);
      roster = await Roster.findOne().sort({ year: -1, month: -1 });
    }
    
    if (!roster) {
      console.log("❌ No roster found in database");
      return [];
    }
    
    console.log(`Roster found for ${roster.month}/${roster.year}`);
    
    const teamMembers = [];
    const seenNames = new Set();
    
    // Iterate through all weeks and employees
    for (const week of roster.weeks || []) {
      if (!week.employees || !Array.isArray(week.employees)) {
        continue;
      }
      
      for (const employee of week.employees) {
        if (!employee) continue;
        
        // Check if this employee's team leader matches the team leader's username
        if (employee.teamLeader && 
            employee.teamLeader.toLowerCase().trim() === teamLeaderUsername.toLowerCase().trim()) {
          
          // Skip the team leader themselves
          if (employee.name.toLowerCase().trim() === teamLeaderUsername.toLowerCase().trim()) {
            console.log(`Skipping self: ${employee.name} is the team leader`);
            continue;
          }
          
          // Use name as key for deduplication
          const nameKey = employee.name.toLowerCase().trim();
          
          if (!seenNames.has(nameKey)) {
            seenNames.add(nameKey);
            
            console.log(`✅ Found team member: ${employee.name}`);
            
            // Try to find if this employee exists as a user (optional)
            let user = null;
            try {
              user = await User.findOne({ 
                username: { $regex: `^${employee.name}$`, $options: "i" } 
              }).select("username department _id");
            } catch (err) {
              console.log("Error finding user:", err.message);
            }
            
            teamMembers.push({
              userId: user?._id || null,  // null if no user record exists
              name: employee.name,
              username: employee.name,
              department: employee.department,
              shiftStartHour: employee.shiftStartHour,
              shiftEndHour: employee.shiftEndHour,
              // Store the original teamLeader for reference
              teamLeader: employee.teamLeader
            });
          }
        }
      }
    }
    
    console.log(`Total team members found for ${teamLeaderUsername}: ${teamMembers.length}`);
    if (teamMembers.length > 0) {
      console.log("Team members:", teamMembers.map(m => m.name).join(", "));
    }
    
    return teamMembers;
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

// Get all team leaders (based on teamLeader field in roster)
export const getAllTeamLeaders = async () => {
  try {
    console.log("=== getAllTeamLeaders ===");
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    console.log("Looking for roster with month:", month, "year:", year);
    
    // Find roster for current month
    let roster = await Roster.findOne({ month, year });
    
    // If no roster for current month, find the latest roster
    if (!roster) {
      console.log(`No roster found for ${month}/${year}, looking for latest...`);
      roster = await Roster.findOne().sort({ year: -1, month: -1 });
    }
    
    if (!roster) {
      console.log("❌ No roster found in database");
      // Return all users as fallback
      const allUsers = await User.find({})
        .select("username department _id")
        .limit(100);
      return allUsers;
    }
    
    console.log(`Roster found for ${roster.month}/${roster.year}`);
    
    const teamLeaderNames = new Set();
    
    // Collect all unique team leader names from roster
    for (const week of roster.weeks || []) {
      if (!week.employees || !Array.isArray(week.employees)) continue;
      
      for (const employee of week.employees) {
        if (!employee) continue;
        
        if (employee.teamLeader && employee.teamLeader !== "") {
          console.log(`Found team leader in roster: "${employee.teamLeader}"`);
          teamLeaderNames.add(employee.teamLeader);
        }
      }
    }
    
    console.log("Unique team leader names:", Array.from(teamLeaderNames));
    
    if (teamLeaderNames.size === 0) {
      console.log("⚠️ No team leaders found in roster");
      const allUsers = await User.find({})
        .select("username department _id")
        .limit(100);
      return allUsers;
    }
    
    // Find users matching these team leader names
    const teamLeaders = [];
    
    for (const tlName of teamLeaderNames) {
      // Find user by username (case-insensitive)
      const user = await User.findOne({ 
        username: { $regex: `^${tlName}$`, $options: "i" } 
      }).select("username department _id");
      
      if (user) {
        console.log(`✅ Found user for team leader: ${tlName} -> ${user.username}`);
        teamLeaders.push(user);
      } else {
        console.log(`⚠️ No user found for team leader name: ${tlName}`);
        // Still add a placeholder so it appears in dropdown
        teamLeaders.push({
          _id: `temp_${tlName}`,
          username: tlName,
          department: "Unknown"
        });
      }
    }
    
    console.log(`Total team leaders: ${teamLeaders.length}`);
    return teamLeaders;
  } catch (error) {
    console.error("Error fetching team leaders:", error);
    const allUsers = await User.find({})
      .select("username department _id")
      .limit(100);
    return allUsers;
  }
};

// Check if a user is a team leader
export const isUserTeamLeader = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    let roster = await Roster.findOne({ month, year });
    if (!roster) {
      roster = await Roster.findOne().sort({ year: -1, month: -1 });
    }
    
    if (!roster) return false;
    
    for (const week of roster.weeks || []) {
      for (const employee of week.employees || []) {
        if (employee && employee.teamLeader && 
            employee.teamLeader.toLowerCase().trim() === user.username.toLowerCase().trim()) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking team leader status:", error);
    return false;
  }
};
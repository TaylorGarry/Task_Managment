// jobs/delegationExpiry.js
import cron from "node-cron";
import Delegation from "../Modals/Delegation/delegation.modal.js";

cron.schedule("0 * * * *", async () => {
  try {
    const expiredDelegations = await Delegation.find({
      status: "active",
      endDate: { $lt: new Date() }
    });
    
    for (const delegation of expiredDelegations) {
      delegation.status = "expired";
      await delegation.save();
      console.log(`Delegation ${delegation._id} expired for ${delegation.delegator}`);
    }
    
    if (expiredDelegations.length > 0) {
      console.log(`Expired ${expiredDelegations.length} delegations`);
    }
  } catch (error) {
    console.error("Error in delegation expiry job:", error);
  }
});

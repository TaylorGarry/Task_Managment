import PushSubscription from "../utils/PushSubscription.js";

export const savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id },
      { subscription },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save subscription" });
  }
};

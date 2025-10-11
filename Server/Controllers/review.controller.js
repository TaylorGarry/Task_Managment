import Review from "../Modals/Review.modal.js";
import Task from "../Modals/Task.modal.js";

// ✅ Add a review (Employee)
export const addReview = async (req, res) => {
  try {
    const { taskId, comment, issue } = req.body;

    if (req.user.accountType !== "employee") {
      return res.status(403).json({ message: "Only employees can add reviews" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (String(task.assignedTo) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only review your own tasks" });
    }

    const newReview = new Review({
      task: taskId,
      employee: req.user.id,
      comment,
      issue,
    });

    await newReview.save();

    res.status(201).json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all reviews for a task (Admin only)
export const getReviewsByTask = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can view reviews" });
    }

    const { taskId } = req.params;
    const reviews = await Review.find({ task: taskId }).populate("employee", "username");

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Mark review as resolved (Admin)
export const resolveReview = async (req, res) => {
  try {
    if (req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can resolve reviews" });
    }

    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.status = "Resolved";
    await review.save();

    res.status(200).json({ message: "Review marked as resolved", review });
  } catch (error) {
    console.error("Resolve Review Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const express = require("express");
const {
  applyAsWorker,
  addFeedback,
} = require("../controllers/workerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/apply", authMiddleware, applyAsWorker);

// 1. Add feedback (Client to Worker)
router.post("/feedback/:workerId", authMiddleware, addFeedback);

module.exports = router;

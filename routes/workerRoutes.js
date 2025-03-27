const express = require("express");
const { applyAsWorker } = require("../controllers/workerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/apply", authMiddleware, applyAsWorker);

module.exports = router;

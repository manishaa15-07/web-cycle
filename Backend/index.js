import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { quiz } from "./data.js";
import { resetpass, review, signupauth } from "./mailer.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let verificationcode = "";

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

let data_base = {
  Test01: {
    scores: [60, null, null, null],
    total: 60,
    password: "abcdefgh",
    email: "u23cs036@coed.svnit.ac.in",
    attempts: [{ quiz: 0, points: 60, time: "00:00:00" }],
  },
  Test02: {
    scores: [80, null, null, null],
    total: 80,
    password: "abcdefgh",
    email: "u23cs196@coed.svnit.ac.in",
    attempts: [{ quiz: 0, points: 80, time: "00:00:00" }],
  },
};

const quizheading = [
  { totalPoints: "80", quizTitle: "Sustainability Basics" },
  { totalPoints: "80", quizTitle: "Advanced Sustainability Concepts" },
  { totalPoints: "80", quizTitle: "Sustainable Development Goals" },
  { totalPoints: "80", quizTitle: "Sustainability Innovations" },
];

app.post("/quiz", (req, res) => {
  let arr = [];
  Object.keys(data_base).forEach((key) => {
    arr.push([key, data_base[key].total]);
  });

  if (arr.length !== 1) arr.sort((a, b) => b[1] - a[1]);

  if (req.body.username === "") {
    res.json({
      quizInfo: quizheading,
      userData: [null, null, null, null],
      leaderboardData: arr,
    });
  } else {
    res.json({
      quizInfo: quizheading,
      userData: data_base[req.body.username].scores,
      leaderboardData: arr,
    });
  }
});

app.post("/attempt", (req, res) => {
  res.json(quiz[req.body.id]);
});

app.post("/quiz/submit", (req, res) => {
  const now = new Date();
  const time = now.toTimeString().split(" ")[0];

  if (req.body.ID === "") {
    res.json({ message: "Please login/ sign up to save scores" });
  } else {
    data_base[req.body.ID].scores[req.body.quizID] = Math.max(
      req.body.correctPoints,
      data_base[req.body.ID].scores[req.body.quizID]
    );

    let sum = data_base[req.body.ID].scores.reduce((a, b) => a + b, 0);
    data_base[req.body.ID].total = sum;

    data_base[req.body.ID].attempts.unshift({
      quiz: req.body.quizID,
      points: req.body.correctPoints,
      time,
    });

    res.json({ message: "Quiz question submitted successfully!" });
  }
});

app.post("/signup", (req, res) => {
  if (!req.body.authcode) {
    verificationcode = generateRandomString(6);

    let exists = Object.values(data_base).some(
      (u) => u.email === req.body.email
    );

    if (exists) {
      return res.json({ loggedIn: false, errorMessage: "Email already in use" });
    }

    signupauth(req.body.email, verificationcode);
    res.json({ message: "Email sent successfully", loggedIn: true });
  } else {
    if (req.body.authcode === verificationcode) {
      data_base[req.body.name] = {
        scores: [null, null, null, null],
        total: 0,
        password: req.body.password,
        email: req.body.email,
        attempts: [],
      };
      res.json({ error: false });
    } else {
      res.json({ error: true });
    }
  }
});

app.post("/login", (req, res) => {
  const { name, password } = req.body;

  if (req.body.authcode === "" && req.body.resetpass === false) {
    if (!data_base[name]) {
      return res.json({ loggedIn: false, errorMessage: "Account does not exist" });
    }

    if (data_base[name].password === password) {
      res.json({ loggedIn: true, errorMessage: "" });
    } else {
      res.json({ loggedIn: false, errorMessage: "Incorrect password" });
    }
  } else if (req.body.authcode === "" && req.body.resetpass === true) {
    verificationcode = generateRandomString(6);
    resetpass(data_base[name].email, verificationcode);
    res.json({ message: "Verification mail sent successfully!" });
  } else if (req.body.authcode && req.body.resetpass === true) {
    res.json({ error: req.body.authcode !== verificationcode });
  } else {
    data_base[name].password = req.body.password;
    res.json({ error: false });
  }
});

app.post("/profile", (req, res) => {
  if (req.body.username !== "") {
    res.json([
      data_base[req.body.username].attempts,
      data_base[req.body.username].email,
    ]);
  }
});

export default app;
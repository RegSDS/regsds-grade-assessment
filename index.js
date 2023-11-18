require("dotenv").config();

const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const math = require("mathjs");
const port = process.env.GRADE_ASSESSMENT_PORT;
const axios = require("axios");

app.use(bodyParser.json());

function convertGradeToPoints(grade) {
  switch (grade) {
    case "A":
      return 4.0;
    case "B+":
      return 3.5;
    case "B":
      return 3.0;
    case "C+":
      return 2.5;
    case "C":
      return 2.0;
    case "D+":
      return 1.5;
    case "D":
      return 1.0;
    case "F":
      return 0.0;
    default:
      return 0.0;
  }
}

app.post("/gradeAssessment", (req, res) => {
  const students = req.body.students;
  const criteria = req.body.criteria;

  const isPDF = req.body.isPDF;
  students.sort((a, b) => b.score - a.score);

  if (!criteria[0].isGroup) {
    // Criterion -referenced
    const AThreshold = criteria[0].A_score;
    const BPlusThreshold = criteria[0].B_plus_score;
    const BThreshold = criteria[0].B_score;
    const CPlusThreshold = criteria[0].C_plus_score;
    const CThreshold = criteria[0].C_score;
    const DPlusThreshold = criteria[0].D_plus_score;
    const DThreshold = criteria[0].D_score;
    const FThreshold = criteria[0].F_score;

    students.forEach((student, index) => {
      if (student.score >= AThreshold) {
        student.grade = "A";
      } else if (student.score >= BPlusThreshold) {
        student.grade = "B+";
      } else if (student.score >= BThreshold) {
        student.grade = "B";
      } else if (student.score >= CPlusThreshold) {
        student.grade = "C+";
      } else if (student.score >= CThreshold) {
        student.grade = "C";
      } else if (student.score >= DPlusThreshold) {
        student.grade = "D+";
      } else if (student.score >= DThreshold) {
        student.grade = "D";
      } else if (student.score < FThreshold) {
        student.grade = "F";
      }
    });
  } else {
    // Norm - referenced
    const scores = students.map((student) => student.score);
    const meanScore = math.mean(scores);
    const stdDeviation = math.std(scores);
    students.forEach((student, index) => {
      const zScore = (student.score - meanScore) / stdDeviation;
      const percentile = 0.5 * (1 + math.erf(zScore / math.sqrt(2))) * 100;
      if (percentile >= 80) {
        student.grade = "A";
      } else if (percentile >= 75) {
        student.grade = "B+";
      } else if (percentile >= 70) {
        student.grade = "B";
      } else if (percentile >= 60) {
        student.grade = "C+";
      } else if (percentile >= 50) {
        student.grade = "C";
      } else if (percentile >= 40) {
        student.grade = "D+";
      } else if (percentile >= 33) {
        student.grade = "D+";
      } else {
        student.grade = "F";
      }
    });
  }
  let sumGrade = 0;
  students.forEach((student) => {
    sumGrade += convertGradeToPoints(student.grade);
  });
  const totalStudents = students.length;
  sumGrade = sumGrade / totalStudents;

  let pdfFile = null;
  if (isPDF) {
    const genPdfUrl = process.env.GENERATE_PDF_URL || "http://localhost:5000";
    axios
      .post(
        genPdfUrl + "/generate-pdf/grade-assessment",
        {
          name: req.body.name,
          course: req.body.course,
          gradeAverage: sumGrade,
          students: students,
        },
        {
          responseType: "arraybuffer",
        }
      )
      .then((response) => {
        pdfFile = response.data;
      })
      .catch((error) => {
        console.error("Error:", error.message);
      });
  }

  return res.json({ students, sumGrade, pdfFile });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

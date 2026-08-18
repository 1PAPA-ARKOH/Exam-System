/**
 * Student Examination System — Result Page
 * result.js
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  Config                                                            */
  /* ------------------------------------------------------------------ */
  const CONFIG = {
    storageKeys: {
      student: "ses_student",       // { name, id }
      answers: "ses_answers",       // { qId: selectedOption }
      questions: "ses_questions",   // [{ id, correct, ... }]
      result: "ses_result",         // cached computed result
      examMeta: "ses_exam_meta",    // { date, time, duration }
      // Legacy keys used by existing index.js / exam.js
      legacyStudent: "studentData",
      legacyResult: "examResult"
    },
    passMark: 50,                   // percentage
    pages: {
      home: "index.html",
      exam: "exam.html",
      login: "index.html"
    },
    grades: [
      { min: 80, grade: "A" },
      { min: 70, grade: "B" },
      { min: 60, grade: "C" },
      { min: 50, grade: "D" },
      { min: 0,  grade: "F" }
    ]
  };

  /* ------------------------------------------------------------------ */
  /*  Storage helpers                                                   */
  /* ------------------------------------------------------------------ */
  function getJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeKeys(...keys) {
    keys.forEach((k) => localStorage.removeItem(k));
  }

  /* ------------------------------------------------------------------ */
  /*  Date / time                                                       */
  /* ------------------------------------------------------------------ */
  function formatOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function formatDisplayDate(date = new Date()) {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    return `${formatOrdinal(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function formatDisplayTime(date = new Date()) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  /* ------------------------------------------------------------------ */
  /*  Grade / pass                                                      */
  /* ------------------------------------------------------------------ */
  function getGrade(percentage) {
    return CONFIG.grades.find((g) => percentage >= g.min).grade;
  }

  function isPass(percentage) {
    return percentage >= CONFIG.passMark;
  }

  /* ------------------------------------------------------------------ */
  /*  Compute result                                                    */
  /* ------------------------------------------------------------------ */
  function computeResult() {
    // Prefer a result already saved by exam.js
    const cached =
      getJSON(CONFIG.storageKeys.result) ||
      getJSON(CONFIG.storageKeys.legacyResult);

    if (cached && (typeof cached.correct === "number" || typeof cached.score === "number")) {
      return normalizeResult(cached);
    }

    const student =
      getJSON(CONFIG.storageKeys.student, {}) ||
      getJSON(CONFIG.storageKeys.legacyStudent, {});
    const answers = getJSON(CONFIG.storageKeys.answers, {});
    const questions = getJSON(CONFIG.storageKeys.questions, []);
    const meta = getJSON(CONFIG.storageKeys.examMeta, {});

    const total = questions.length || Number(cached?.total) || 10;
    let correct = 0;

    if (questions.length) {
      questions.forEach((q) => {
        const given = answers[q.id] ?? answers[String(q.id)];
        if (given != null && String(given) === String(q.correct)) {
          correct += 1;
        }
      });
       } else if (cached) {
      correct = cached.correct;
    }

    const wrong = Math.max(total - correct, 0);
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    const now = new Date();

    const result = {
      studentName: student.name || student.fullName || "Student",
      studentId: student.id || student.studentId || "—",
      total,
      correct,
      wrong,
      percentage,
      grade: getGrade(percentage),
      passed: isPass(percentage),
      date: meta.date || formatDisplayDate(now),
      time: meta.time || formatDisplayTime(now)
    };

    setJSON(CONFIG.storageKeys.result, result);
    return result;
  }

  function normalizeResult(r) {
    const total = Number(r.total) || 0;
    const correct = Number(r.correct != null ? r.correct : r.score) || 0;
    const wrong = r.wrong != null ? Number(r.wrong) : Math.max(total - correct, 0);
    const percentage =
      r.percentage != null
        ? Math.round(Number(r.percentage))
        : total
          ? Math.round((correct / total) * 100)
          : 0;

    return {
      studentName:
        r.studentName ||
        r.name ||
        r.student?.fullName ||
        r.student?.name ||
        "Student",
      studentId:
        r.studentId ||
        r.id ||
        r.student?.studentId ||
        r.student?.id ||
        "—",
      total,
      correct,
      wrong,
      percentage,
      grade: r.grade || getGrade(percentage),
      passed: r.passed != null ? Boolean(r.passed) : isPass(percentage),
      date: r.date || (r.submittedAt ? formatDisplayDate(new Date(r.submittedAt)) : formatDisplayDate()),
      time: r.time || (r.submittedAt ? formatDisplayTime(new Date(r.submittedAt)) : formatDisplayTime())
    };
  }

  /* ------------------------------------------------------------------ */
  /*  DOM                                                               */
  /* ------------------------------------------------------------------ */
  function $(sel) {
    return document.querySelector(sel);
  }

  function setText(sel, value) {
    const el = $(sel);
    if (el) el.textContent = value;
  }

  function renderHeader(result) {
    const label = `${result.studentName} (${result.studentId})`;
    setText("[data-user-label]", label);
    setText("#userLabel", label);
    setText("#student-name", label);
  }

  function renderRing(percentage) {
    const circle = $(".progress-ring .progress");
    const label = $(".percentage");

    if (label) label.textContent = `${percentage}%`;

    if (circle) {
      // circumference of r=15.9155 ≈ 100, so dash = percentage
      circle.style.strokeDasharray = `${percentage}, 100`;
      circle.style.stroke = percentage >= CONFIG.passMark ? "#22c55e" : "#ef4444";
    }

    if (label) {
      label.style.color = percentage >= CONFIG.passMark ? "#16a34a" : "#dc2626";
    }
  }

  function renderStatus(result) {
    const passEl = $(".pass-text");
    const congrats = $(".congrats");
    const visual = $(".visual");

    if (passEl) {
      passEl.innerHTML = result.passed
        ? `PASS <i class="fas fa-check-circle"></i>`
        : `FAIL <i class="fas fa-times-circle"></i>`;
      passEl.style.color = result.passed ? "#16a34a" : "#dc2626";
    }

    if (congrats) {
      congrats.textContent = result.passed ? "Congratulations!" : "Better luck next time!";
      congrats.style.color = result.passed ? "#7c3aed" : "#64748b";
    }

    if (visual) {
      visual.classList.toggle("is-fail", !result.passed);
      visual.classList.toggle("is-pass", result.passed);
    }
  }

  function renderSummary(result) {
    setText("[data-student-name]", result.studentName);
    setText("[data-student-id]", result.studentId);
    setText("[data-total]", result.total);
    setText("[data-correct]", result.correct);
    setText("[data-wrong]", result.wrong);
    setText("[data-date-time]", `Date: ${result.date}  |  Time: ${result.time}`);

    // fallbacks matching the original static markup
    const rows = document.querySelectorAll(".summary .row .value");
    if (rows.length >= 5) {
      rows[0].textContent = result.studentName;
      rows[1].textContent = result.studentId;
      rows[2].textContent = result.total;
      rows[3].textContent = result.correct;
      rows[4].textContent = result.wrong;
      rows[3].classList.add("correct");
      rows[4].classList.add("wrong");
    }

    const meta = $(".meta");
    if (meta) meta.textContent = `Date: ${result.date}  |  Time: ${result.time}`;
  }

  function renderStats(result) {
    setText("[data-score]", `${result.correct} / ${result.total}`);
    setText("[data-percentage]", `${result.percentage}%`);
    setText("[data-grade]", result.grade);

    const nums = document.querySelectorAll(".stat .num");
    if (nums.length >= 3) {
      nums[0].textContent = `${result.correct} / ${result.total}`;
      nums[1].textContent = `${result.percentage}%`;
      nums[2].textContent = result.grade;
    }
  }
  function render(result) {
    renderHeader(result);
    renderRing(result.percentage);
    renderStatus(result);
    renderSummary(result);
    renderStats(result);
    document.title = `Result ${result.percentage}% — Student Examination System`;
  }

  /* ------------------------------------------------------------------ */
  /*  Actions                                                           */
  /* ------------------------------------------------------------------ */
  function retakeExam(e) {
    if (e) e.preventDefault();
    // Keep student session; wipe this attempt
    removeKeys(
      CONFIG.storageKeys.answers,
      CONFIG.storageKeys.result,
      CONFIG.storageKeys.examMeta,
      CONFIG.storageKeys.legacyResult
    );
    window.location.href = CONFIG.pages.exam;
  }

  function goHome(e) {
    if (e) e.preventDefault();
    window.location.href = CONFIG.pages.home;
  }

  function logout(e) {
    if (e) e.preventDefault();
    removeKeys(
      CONFIG.storageKeys.student,
      CONFIG.storageKeys.answers,
      CONFIG.storageKeys.result,
      CONFIG.storageKeys.examMeta,
      CONFIG.storageKeys.legacyStudent,
      CONFIG.storageKeys.legacyResult
      // keep questions bank if you reuse it
    );
    window.location.href = CONFIG.pages.home;
  }

  function bindActions() {
    const retake = $(".btn-retake") || $('[href="exam.html"]');
    const home = $(".btn-home") || $('[href="index.html"]');
    const logoutBtn = $(".logout-btn") || $('[href="index.html"]');

    if (retake) retake.addEventListener("click", retakeExam);
    if (home) home.addEventListener("click", goHome);
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
  }

  /* ------------------------------------------------------------------ */
  /*  Guard + init                                                      */
  /* ------------------------------------------------------------------ */
  function init() {
    const student =
      getJSON(CONFIG.storageKeys.student) ||
      getJSON(CONFIG.storageKeys.legacyStudent);
    const cached =
      getJSON(CONFIG.storageKeys.result) ||
      getJSON(CONFIG.storageKeys.legacyResult);
    const answers = getJSON(CONFIG.storageKeys.answers);

    // Keep the result page visible even when session data is missing.
    // This avoids redirect loops and lets users see the screen structure.
    if (!student && !cached) {
      console.warn("No saved result found. Rendering default result view.");
    }

    if (student && !cached && !answers) {
      console.warn("No submitted result found yet. Rendering fallback result view.");
    }

    const result = computeResult();
    render(result);
    bindActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for exam.js if it wants to write a result then redirect
  window.SESResult = {
    computeResult,
    save(partial) {
      const current = computeResult();
      const merged = normalizeResult({ ...current, ...partial });
      setJSON(CONFIG.storageKeys.result, merged);
      return merged;
    }
  };
})();
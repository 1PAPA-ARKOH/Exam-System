  // Sample Questions
        let questions = [
            {
                id: 1,
                question: "Which language is used to style webpages?",
                options: ["A. HTML", "B. CSS", "C. JavaScript", "D. Python"],
                correct: "B"
            },
            {
                id: 2,
                question: "What does HTML stand for?",
                options: ["A. Hyper Text Markup Language", "B. High Transfer Machine Language", "C. Hyper Text Modern Language", "D. Home Tool Markup Language"],
                correct: "A"
            },
            {
                id: 3,
                question: "Which of these is used to make webpages interactive?",
                options: ["A. HTML", "B. CSS", "C. JavaScript", "D. SQL"],
                correct: "C"
            },
            {
                id: 4,
                question: "What is the correct way to link an external CSS file?",
                options: ["A. <link src='style.css>", "B. <style src='style.css'>", "C. <link rel='stylesheet' href='style.css'>", "D. <css href='style.css'>"],
                correct: "C"
            },
            {
                id: 5,
                question: "Which tag is used for the largest heading?",
                options: ["A. <h6>", "B. <h1>", "C. <head>", "D. <header>"],
                correct: "B"
            },
            {
                id: 6,
                question: "What does CSS stand for?",
                options: ["A. Computer Style System", "B. Cascading Style Sheets", "C. Creative Style Syntax", "D. Colorful Style System"],
                correct: "B"
            },
            {
                id: 7,
                question: "Which HTTP method is used to retrieve data from a server?",
                options: ["A. POST", "B. PUT", "C. GET", "D. DELETE"],
                correct: "C"
            },
            {
                id: 8,
                question: "What is the purpose of the <div> tag?",
                options: ["A. To create a hyperlink", "B. To create a container for styling", "C. To display images", "D. To create lists"],
                correct: "B"
            },
            {
                id: 9,
                question: "Which of these is a JavaScript framework?",
                options: ["A. React", "B. Bootstrap", "C. Tailwind", "D. MySQL"],
                correct: "A"
            },
            {
                id: 10,
                question: "What does DOM stand for?",
                options: ["A. Document Object Model", "B. Data Object Management", "C. Document Order Model", "D. Digital Object Mapping"],
                correct: "A"
            }
        ];
        let currentQuestion = 0;
        let answers = new Array(questions.length).fill(null);
        let timerInterval;
        let timeLeft = 10 * 60; // 10 minutes in seconds

        const studentData = JSON.parse(localStorage.getItem('studentData')) || {};
        
        // Load student name
        document.getElementById('student-name').textContent = 
            `${studentData.fullName || "Student Name"} (${studentData.studentId || "21****4"})`;
            // Render question navigation
        function renderNavigation() {
            const grid = document.getElementById('question-grid');
            grid.innerHTML = '';
            
            for (let i = 0; i < questions.length; i++) {
                const btn = document.createElement('div');
                btn.className = `q-btn ${i === currentQuestion ? 'current' : ''} ${answers[i] ? 'answered' : ''}`;
                btn.textContent = i + 1;
                btn.onclick = () => goToQuestion(i);
                grid.appendChild(btn);
            }
        }

        // Render current question
        function renderQuestion() {
            const q = questions[currentQuestion];
            
            document.getElementById('question-text').textContent = q.question;
            document.getElementById('question-count').textContent = `${currentQuestion + 1} of ${questions.length}`;

            const container = document.getElementById('options-container');
            container.innerHTML = '';

            q.options.forEach((option, index) => {
                const div = document.createElement('div');
                div.className = `option ${answers[currentQuestion] === option[0] ? 'selected' : ''}`;

                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'answer';
                input.id = `opt${index}`;
                input.checked = answers[currentQuestion] === option[0];

                const label = document.createElement('label');
                label.setAttribute('for', input.id);
                label.textContent = option;

                div.appendChild(input);
                div.appendChild(label);
                div.onclick = () => selectAnswer(option[0]);
                container.appendChild(div);
            });

            renderNavigation();
        }
         function selectAnswer(letter) {
            answers[currentQuestion] = letter;
            renderQuestion();
        }

        function goToQuestion(index) {
            currentQuestion = index;
            renderQuestion();
        }

        function nextQuestion() {
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                renderQuestion();
            }
        }

        function prevQuestion() {
            if (currentQuestion > 0) {
                currentQuestion--;
                renderQuestion();
            }
        }

        function startTimer() {
            timerInterval = setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                document.getElementById('timer').textContent = display;

                if (timeLeft <= 120) {
                    document.getElementById('timer').style.color = '#e63946';
                }

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    submitExam(true);
                }
            }, 1000);
        }

        function submitExam(isAuto = false) {
            if (!isAuto && !confirm("Are you sure you want to submit your exam? This action cannot be undone.")) {
                return;
            }

            clearInterval(timerInterval);

            let score = 0;
            answers.forEach((answer, index) => {
                if (answer === questions[index].correct) score++;
            });

            const resultData = {
                student: studentData,
                score: score,
                total: questions.length,
                percentage: Math.round((score / questions.length) * 100),
                answers: answers,
                timeTaken: (10 * 60 - timeLeft),
                submittedAt: new Date().toISOString()
            };

            localStorage.setItem('examResult', JSON.stringify(resultData));
            window.location.href = 'result.html';
        }
        function logout() {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = 'index.html';
            }
        }
          // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            if (!studentData.fullName) {
                alert("Please register first!");
                window.location.href = 'index.html';
                return;
            }

            renderNavigation();
            renderQuestion();
            startTimer();
        });
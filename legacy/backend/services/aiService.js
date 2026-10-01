// ==========================================
// AI PLACEMENT SERVICE LAYER
// Smart Placement Assistant
// Developer: Vedant Patil
// ==========================================

const https = require("https");

// Curated Domain Knowledge Base for Resilient Placement Engine
const PLACEMENT_KNOWLEDGE_BASE = {
    technical: [
        {
            role: "Full Stack / MERN",
            questions: [
                {
                    q: "Explain the Event Loop in Node.js and how asynchronous I/O works under the hood.",
                    a: "Node.js uses libuv to handle asynchronous non-blocking operations. The event loop consists of distinct phases: Timers (setTimeout/setInterval), Pending Callbacks, Poll (retrieves new I/O events), Check (setImmediate), and Close callbacks. Microtasks (process.nextTick and Promise callbacks) execute immediately after the current operation finishes and before moving to the next phase."
                },
                {
                    q: "What are MongoDB Indexes and how do compound indexes optimize query performance?",
                    a: "Indexes in MongoDB use B-trees to drastically reduce the number of documents scanned. Without an index, MongoDB must perform a collection scan (COLLSCAN). A compound index supports queries matching a prefix of index keys (e.g. index on { branch: 1, cgpa: -1 } accelerates sorting and filtering on both fields)."
                },
                {
                    q: "How does JWT (JSON Web Token) authentication work and how do you secure it?",
                    a: "A JWT consists of Header, Payload, and Signature (HMAC or RSA). The server verifies authenticity by recalculating the signature with its secret key. Best security practices: Use short expiration times (e.g., 15m), store refresh tokens securely in httpOnly SameSite cookies, and always enforce HTTPS."
                }
            ]
        },
        {
            role: "Frontend / React / JavaScript",
            questions: [
                {
                    q: "What is the difference between JavaScript's call, apply, and bind methods?",
                    a: "call and apply invoke a function immediately with a specified 'this' context; call takes arguments comma-separated, while apply accepts arguments as an array. bind does not execute immediately; it returns a new bound function with permanently tied 'this' and preset arguments."
                },
                {
                    q: "Explain React's Virtual DOM and Reconciliation algorithm (Fiber).",
                    a: "React maintains a lightweight in-memory representation of the real DOM. When state changes, a new Virtual DOM tree is created. React Fiber performs diffing (heuristics O(n) algorithm comparing element types and keys) to compute minimal DOM updates, batching changes for smooth 60fps rendering."
                }
            ]
        }
    ],

    hr: [
        {
            q: "Tell me about yourself and why you chose engineering / computer science.",
            tip: "Structure using Past -> Present -> Future: Introduce your educational background, highlight 2 core technical projects, explain your passion for problem-solving, and express why this company's culture aligns with your career goals."
        },
        {
            q: "Where do you see yourself in 3 to 5 years?",
            tip: "Avoid vague statements. Emphasize becoming a dependable technical anchor, mastering system architecture, mentoring junior peers, and driving business impact."
        },
        {
            q: "Describe a challenge you faced in a group project and how you resolved it.",
            tip: "Use the STAR framework: Situation, Task, Action, Result. Focus on active communication, empathy, objective problem decomposition, and measurable success."
        }
    ],

    resumeTips: [
        "Use strong action verbs at the beginning of each bullet (e.g., Architected, Optimized, Engineered, Streamlined).",
        "Quantify your accomplishments (e.g., 'Reduced API latency by 45% through Redis caching').",
        "Keep resume layout single-column or clean two-column with no embedded graphics or tables that break ATS parsers.",
        "Ensure live hyperlinks to GitHub and deployed live demos are clickable."
    ]
};

// ==========================================
// Gemini API Integration (if key provided)
// ==========================================
async function callGeminiAPI(prompt, apiKey) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
            }
        });

        const options = {
            hostname: "generativelanguage.googleapis.com",
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
            },
            timeout: 10000,
        };

        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
                        const answer = parsed.candidates[0].content.parts[0].text;
                        resolve(answer);
                    } else if (parsed.error) {
                        reject(new Error(parsed.error.message || "Gemini API error"));
                    } else {
                        reject(new Error("Empty response from Gemini"));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Gemini API request timed out"));
        });

        req.write(payload);
        req.end();
    });
}

// ==========================================
// Main AI Query Handler
// ==========================================
exports.generateAIResponse = async (userPrompt, context = "placement") => {
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Try Gemini API if key is present
    if (apiKey && apiKey.trim().length > 10) {
        try {
            const systemInstructions = `You are the AI Placement Mentor for "Smart Placement Assistant" (developed by Vedant Patil). Provide practical, encouraging, and highly technical or HR placement guidance to university students. Keep responses crisp, well-formatted with markdown, and actionable.`;
            const fullPrompt = `${systemInstructions}\n\nStudent Query: ${userPrompt}`;
            const geminiResponse = await callGeminiAPI(fullPrompt, apiKey);
            return {
                source: "Google Gemini AI",
                text: geminiResponse,
            };
        } catch (err) {
            console.warn("⚠️ Gemini API call failed, falling back to Placement Engine:", err.message);
        }
    }

    // 2. Intelligent Built-in Placement Engine Fallback
    const q = userPrompt.toLowerCase();

    // Interview Question Practice
    if (q.includes("interview") || q.includes("question") || q.includes("technical") || q.includes("hr")) {
        if (q.includes("hr") || q.includes("behavioral")) {
            const item = PLACEMENT_KNOWLEDGE_BASE.hr[Math.floor(Math.random() * PLACEMENT_KNOWLEDGE_BASE.hr.length)];
            return {
                source: "Placement Intelligence Engine",
                text: `**HR Interview Practice Question:**\n\n🎯 **"${item.q}"**\n\n💡 **Mentor Strategy:**\n${item.tip}\n\n*Practice aloud for 90 seconds and record your answer to review body language and confidence!*`
            };
        } else {
            const category = PLACEMENT_KNOWLEDGE_BASE.technical[0];
            const item = category.questions[Math.floor(Math.random() * category.questions.length)];
            return {
                source: "Placement Intelligence Engine",
                text: `**Technical Interview Practice (${category.role}):**\n\n💻 **Q:** ${item.q}\n\n📝 **Key Concept to Explain:**\n${item.a}\n\n*Bonus Tip: In technical rounds, always state your assumptions and discuss Time & Space Complexity before writing code!*`
            };
        }
    }

    // Resume improvement suggestions
    if (q.includes("resume") || q.includes("cv") || q.includes("ats")) {
        const tips = PLACEMENT_KNOWLEDGE_BASE.resumeTips.map((t, i) => `${i + 1}. ${t}`).join("\n");
        return {
            source: "Placement Intelligence Engine",
            text: `**📄 ATS Resume Optimization Tips for Campus Placements:**\n\n${tips}\n\n*You can upload your PDF in our **Resume Module** to view ATS compatibility and skills extracted directly!*`
        };
    }

    // Jobs / Placement guidance
    if (q.includes("job") || q.includes("career") || q.includes("roadmap") || q.includes("skills")) {
        return {
            source: "Placement Intelligence Engine",
            text: `**🚀 2026 Campus Placement Preparation Roadmap:**\n\n1. **Core Data Structures & Algorithms:** Master Arrays, Strings, HashMaps, Trees, Graphs, and Dynamic Programming (Solve 150+ LeetCode problems).\n2. **MERN & Full Stack Foundations:** Build 2 full-stack production projects with authentication, database indexing, and responsive UI.\n3. **CS Fundamentals:** Revise Operating Systems (threads, deadlocks), DBMS (SQL joins, normalization, indexing), and Computer Networks (TCP vs UDP, DNS, HTTP/HTTPS).\n4. **Mock Interviews:** Practice speaking your problem-solving thoughts aloud.\n\n*Check the **Jobs Portal** to browse verified campus openings tailored to your skills!*`
        };
    }

    // General Greeting or Question
    return {
        source: "Placement Intelligence Engine",
        text: `👋 Hello! I am your **Smart Placement AI Assistant**.\n\nI can help you with:\n- 🎯 **Technical & Coding Interview Practice** (Data Structures, Node.js, JavaScript, Python, SQL)\n- 👔 **HR Behavioral Questions & STAR Method**\n- 📄 **Resume ATS Score & Bullet Point Review**\n- 💼 **Job Preparation Roadmaps & Company Specific Guidance**\n\nWhat would you like to practice today?`
    };
};

// ==========================================
// Resume Skills & Gap Analysis
// ==========================================
exports.analyzeSkillsAndMatch = (studentSkills = [], targetJob = null) => {
    const defaultRequired = targetJob && Array.isArray(targetJob.skills) && targetJob.skills.length > 0
        ? targetJob.skills
        : ["Data Structures", "JavaScript", "React", "Node.js", "MongoDB", "SQL", "Git"];

    const normalizedStudent = studentSkills.map((s) => s.toLowerCase().trim());
    const matched = [];
    const missing = [];

    defaultRequired.forEach((reqSkill) => {
        if (normalizedStudent.some((s) => s.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(s))) {
            matched.push(reqSkill);
        } else {
            missing.push(reqSkill);
        }
    });

    const matchScore = Math.min(100, Math.max(30, Math.round((matched.length / defaultRequired.length) * 100)));

    return {
        matchScore,
        matchedSkills: matched,
        missingSkills: missing,
        recommendations: missing.map((m) => `Complete a mini-project or certification demonstrating hands-on proficiency in ${m}.`),
    };
};

/* ==========================================
   SMART PLACEMENT ASSISTANT
   Version : 1.0
========================================== */

console.log("Smart Placement Assistant Loaded Successfully");
/* ==========================================
   SMART PLACEMENT ASSISTANT
   VERSION 1.7
========================================== */

const chatButton = document.querySelector(".chat-button");
const chatBox = document.querySelector(".chat-box");
const closeChat = document.querySelector(".close-chat");

chatButton.addEventListener("click", () => {
    chatBox.style.display = "block";
    chatBody.scrollTop = chatBody.scrollHeight;
});




closeChat.addEventListener("click", () => {
    chatBox.style.display = "none";
});
const sendBtn = document.querySelector(".send-btn");
const chatInput = document.querySelector(".chat-input");
const chatBody = document.querySelector("#chatBody");

function sendMessage() {

    const message = chatInput.value.trim();

    if (message === "") return;

    chatBody.innerHTML += `
        <p class="user-message">${message}</p>
    `;

    chatInput.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    const typing = document.createElement("p");
 typing.className = "bot-message";
 typing.id = "typing";
 typing.innerText = "🤖 AI is typing...";

chatBody.appendChild(typing);
chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {

        const typing = document.getElementById("typing");

 if (typing) {
    typing.remove();
}

    let reply = "";

    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
        reply = "👋 Hello Vedant! Welcome to Smart Placement Assistant.";
    }

    else if (message.toLowerCase().includes("job")) {
        reply = "💼 We have many jobs available for CSE students.";
    }

    else if (message.toLowerCase().includes("resume")) {
        reply = "📄 Resume Builder module will help you create an ATS-friendly resume.";
    }

    else {
        reply = "🤖 Sorry, I didn't understand. Please ask another question.";
    }

    chatBody.innerHTML += `
        <p class="bot-message">${reply}</p>
    `;

    chatBody.scrollTop = chatBody.scrollHeight;

}, 500);
}

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", function(e) {

    if (e.key === "Enter") {
        sendMessage();
    }

});
const quickBtns = document.querySelectorAll(".quick-btn");

quickBtns.forEach(btn => {

    btn.addEventListener("click", () => {

        chatInput.value = btn.innerText;
        sendMessage();

    });

});
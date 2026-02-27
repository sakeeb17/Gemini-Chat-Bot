const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;
let lastRequestTime = 0;
const REQUEST_COOLDOWN = 3000; // 3 sec cooldown

const BACKEND_URL = "http://localhost:5000/api/chat";

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(" ");
    let index = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText +=
            (index === 0 ? "" : " ") + words[index++];
        if (index === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            typingForm.querySelector(".typing-input").disabled = false;
            localStorage.setItem("savedChats", chatList.innerHTML);
        }
        chatList.scrollTo(0, chatList.scrollHeight);
    }, 50);
};

const generateAPIResponse = async (incomingMessageDiv, retries = 2) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        if (response.status === 429 && retries > 0) {
            await new Promise(res => setTimeout(res, 2000));
            return generateAPIResponse(incomingMessageDiv, retries - 1);
        }

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong");
        }

        const apiResponse = data.reply.replace(/\*\*(.*?)\*\*/g, "$1");

        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        isResponseGenerating = false;
        typingForm.querySelector(".typing-input").disabled = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

const showLoadingAnimation = () => {
    const html = `
        <div class="message-content">
            <img src="gemini.svg" class="avatar">
            <p class="text"></p>
        </div>`;
    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
};

const handleOutgoingChat = () => {
    const now = Date.now();
    if (now - lastRequestTime < REQUEST_COOLDOWN) {
        alert("Please wait before sending another message.");
        return;
    }

    userMessage = typingForm.querySelector(".typing-input").value.trim();
    if (!userMessage || isResponseGenerating) return;

    lastRequestTime = now;
    isResponseGenerating = true;
    typingForm.querySelector(".typing-input").disabled = true;

    const html = `
        <div class="message-content">
            <img src="photo.jpg" class="avatar">
            <p class="text">${userMessage}</p>
        </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    chatList.scrollTo(0, chatList.scrollHeight);

    setTimeout(showLoadingAnimation, 500);
};

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

deleteChatButton.addEventListener("click", () => {
    if (confirm("Delete all chats?")) {
        localStorage.removeItem("savedChats");
        chatList.innerHTML = "";
    }
});

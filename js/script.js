let quicks = document.querySelectorAll(".op-box .options");

let conversations = [];

try {
  conversations = JSON.parse(localStorage.getItem("bybot_chats")) || [];
  if (!Array.isArray(conversations)) conversations = [];
} catch {
  conversations = [];
}

let currentChatId = null;
let currentMessages = [];
let botData;

const saveConversations = () => {
  localStorage.setItem("bybot_chats", JSON.stringify(conversations));
};

const createConversation = () => {
  const chat = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };

  conversations.unshift(chat);

  currentChatId = chat.id;
  currentMessages = chat.messages;

  saveConversations();
  renderPreviousChats();

  return chat;
};

const getCurrentConversation = () => {
  return conversations.find((chat) => chat.id === currentChatId);
};

const saveMessage = (role, content) => {
  const chat = getCurrentConversation();

  if (!chat) return;

  chat.messages.push({
    role,
    content,
    timestamp: Date.now(),
  });

  if (role === "user" && chat.title === "New chat") {
    chat.title = content.trim().slice(0, 35);

    if (content.trim().length > 35) {
      chat.title += "...";
    }
  }

  chat.updatedAt = Date.now();

  currentMessages = chat.messages;

  conversations.sort((a, b) => b.updatedAt - a.updatedAt);

  saveConversations();
  renderPreviousChats();
};

const renderPreviousChats = () => {
  const previousChats = document.querySelector(".prevchats");

  previousChats.querySelectorAll(".pc-box").forEach((box) => box.remove());

  conversations.forEach((chat) => {
    const box = document.createElement("div");
    box.className = "pc-box";

    if (chat.id === currentChatId) {
      box.classList.add("selected");
    }

    const p = document.createElement("p");
    p.textContent = chat.title;

    box.appendChild(p);

    box.addEventListener("click", () => {
      openConversation(chat.id);
    });

    previousChats.appendChild(box);
  });

  filterPreviousChats();
};

const openConversation = (id) => {
  const chat = conversations.find((item) => item.id === id);

  if (!chat) return;

  currentChatId = chat.id;
  currentMessages = chat.messages;

  chatSide.innerHTML = "";

  freshLook.classList.add("not-visible");
  chatSide.classList.add("visible");

  chat.messages.forEach((message) => {
    const bubble = document.createElement("div");

    bubble.className = message.role === "user" ? "chat-bubble" : "cb-msg";
    if (bubble.classList.contains("chat-bubble")) {
      bubble.style.transform = "translateX(0px)";
    }

    const p = document.createElement("p");
    p.textContent = message.content;

    bubble.appendChild(p);
    chatSide.appendChild(bubble);
  });

  chatSide.scrollTo({
    top: chatSide.scrollHeight,
    behavior: "smooth",
  });

  renderPreviousChats();
};

const startNewConversation = () => {
  currentChatId = null;
  currentMessages = [];

  chatSide.innerHTML = "";

  chatSide.classList.remove("visible");
  freshLook.classList.remove("not-visible");

  chatField.value = "";

  activeButton();
  renderPreviousChats();
};

const filterPreviousChats = () => {
  const query = searchbar.value.trim().toLowerCase();

  const boxes = document.querySelectorAll(".prevchats .pc-box");

  let visible = 0;

  boxes.forEach((box) => {
    const matches = box.textContent.toLowerCase().includes(query);

    box.style.display = matches ? "flex" : "none";

    if (matches) visible++;
  });

  nopText.style.display = visible === 0 ? "block" : "none";

  nopText.textContent =
    visible === 0 ? (query ? "No matching chats" : "No Previous chat") : "";
};

const showUserMessage = (message) => {
  const chatBubble = document.createElement("div");

  chatBubble.className = "chat-bubble";

  const p = document.createElement("p");
  p.textContent = message;

  chatBubble.appendChild(p);
  chatSide.appendChild(chatBubble);

  setTimeout(() => {
    chatBubble.classList.add("slide");
  }, 1);
};

const send = async () => {
  const message = chatField.value.trim();

  if (!message || sendBtn.dataset.sending === "true") return;

  sendBtn.dataset.sending = "true";

  chatField.value = "";
  activeButton();

  chatSide.classList.add("visible");
  freshLook.classList.add("not-visible");

  if (!currentChatId) {
    createConversation();
  }

  showUserMessage(message);
  saveMessage("user", message);

  const botBubble = document.createElement("div");
  botBubble.className = "cb-msg";

  const botParagraph = document.createElement("p");
  botParagraph.textContent = "Thinking...";

  botBubble.appendChild(botParagraph);
  chatSide.appendChild(botBubble);

  chatSide.scrollTo({
    top: chatSide.scrollHeight,
    behavior: "smooth",
  });

  try {
    await loadBotData();

    const response = getBotData(message);

    const answer = Array.isArray(response)
      ? response[Math.floor(Math.random() * response.length)]
      : response;

    botParagraph.textContent =
      typeof answer === "string" ? answer : "I couldn't generate a response.";

    saveMessage("bot", botParagraph.textContent);
  } catch (error) {
    botParagraph.textContent = "Sorry, something went wrong. Please try again.";

    console.error(error);
  } finally {
    sendBtn.dataset.sending = "false";
    activeButton();

    chatSide.scrollTo({
      top: chatSide.scrollHeight,
      behavior: "smooth",
    });
  }
};

chatField.addEventListener("keyup", (e) => {
  activeButton();

  if (e.key === "Enter" && !e.shiftKey && chatField.value.trim().length > 0) {
    send();
  }
});

newBtn.onclick = () => {
  startNewConversation();
};

menuBtn.onclick = () =>{
  sideSection.style.display = "flex"
  canSide.style.display = "block"
  setTimeout(()=>{
    sideSection.classList.add('slide')
  },1)
  
}

canSide.onclick = () => {
  sideSection.classList.remove('slide')
  
  setTimeout(() => {
    sideSection.style.display = "none"
canSide.style.display = "none"
  }, 250)
  
}

quicks.forEach((clicks) => {
  clicks.onclick = () => {
    if (clicks.textContent.trim() === "Something interesting") {
      chatField.value = "Tell me something interesting";
    } else {
      chatField.value = clicks.textContent.trim();
    }

    activeButton();
    send();
  };
});

const activeButton = () => {
  if (chatField.value.trim().length > 0 && sendBtn.dataset.sending !== "true") {
    sendBtn.classList.add("active");
    sendBtn.onclick = send;
  } else {
    sendBtn.classList.remove("active");
    sendBtn.onclick = () => {};
  }
};

themebtn.onclick = () => {
  document.body.classList.toggle("dark");
  if (!document.body.classList.contains("dark")) {
    localStorage.removeItem("bybTheme");
  } else {
    localStorage.setItem("bybTheme", true);
  }
};

if (localStorage.getItem("bybTheme")) {
  document.body.classList.add("dark");
}

searchbar.addEventListener("input", filterPreviousChats);

async function loadBotData() {
  if (botData) return;

  const response = await fetch("./js/response.json");

  if (!response.ok) {
    throw new Error("Could not load response.json");
  }

  botData = await response.json();
}

function solveMath(message) {
  const input = message
    .toLowerCase()
    .replace(/[×]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/,/g, "")
    .trim();

  let match;

  match = input.match(
    /(?:what(?:'s| is)|calculate|compute|solve)\s+(?:the\s+)?(?:square root of)\s+(-?\d+(?:\.\d+)?)/,
  );

  if (match) {
    const number = Number(match[1]);

    if (number < 0) {
      return "I can't calculate real square roots of negative numbers.";
    }

    return String(Math.sqrt(number));
  }

  match = input.match(/square root of\s+(-?\d+(?:\.\d+)?)/);

  if (match) {
    const number = Number(match[1]);

    if (number < 0) {
      return "I can't calculate real square roots of negative numbers.";
    }

    return String(Math.sqrt(number));
  }

  match = input.match(/(-?\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(-?\d+(?:\.\d+)?)/);

  if (match) {
    return String((Number(match[1]) / 100) * Number(match[2]));
  }

  match = input.match(
    /(-?\d+(?:\.\d+)?)\s*(?:plus|added to)\s*(-?\d+(?:\.\d+)?)/,
  );

  if (match) {
    return String(Number(match[1]) + Number(match[2]));
  }

  match = input.match(/(-?\d+(?:\.\d+)?)\s*(?:minus|less)\s*(-?\d+(?:\.\d+)?)/);

  if (match) {
    return String(Number(match[1]) - Number(match[2]));
  }

  match = input.match(
    /(-?\d+(?:\.\d+)?)\s*(?:times|multiplied by)\s*(-?\d+(?:\.\d+)?)/,
  );

  if (match) {
    return String(Number(match[1]) * Number(match[2]));
  }

  match = input.match(/(-?\d+(?:\.\d+)?)\s*(?:divided by)\s*(-?\d+(?:\.\d+)?)/);

  if (match) {
    const divisor = Number(match[2]);

    if (divisor === 0) {
      return "You can't divide by zero!";
    }

    return String(Number(match[1]) / divisor);
  }

  const expressionMatch = input.match(
    /(?:what(?:'s| is)\s+|calculate\s+|compute\s+|solve\s+)?(-?\d+(?:\.\d+)?(?:\s*[+\-*/^()]\s*-?\d+(?:\.\d+)?)+)\s*\??$/,
  );

  if (!expressionMatch) return null;

  const expression = expressionMatch[1].replace(/\s+/g, "");

  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/^()]/g);

  if (!tokens || tokens.join("") !== expression) return null;

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();

      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parsePower();

    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = parsePower();

      if (operator === "/" && right === 0) {
        throw new Error("DIVISION_BY_ZERO");
      }

      value = operator === "*" ? value * right : value / right;
    }

    return value;
  }

  function parsePower() {
    let value = parseUnary();

    if (tokens[position] === "^") {
      position++;
      value = Math.pow(value, parsePower());
    }

    return value;
  }

  function parseUnary() {
    if (tokens[position] === "-") {
      position++;
      return -parseUnary();
    }

    if (tokens[position] === "+") {
      position++;
      return parseUnary();
    }

    if (tokens[position] === "(") {
      position++;

      const value = parseExpression();

      if (tokens[position] !== ")") {
        throw new Error("INVALID_EXPRESSION");
      }

      position++;

      return value;
    }

    const token = tokens[position++];

    if (token === undefined || !/^\d+(?:\.\d+)?$/.test(token)) {
      throw new Error("INVALID_EXPRESSION");
    }

    return Number(token);
  }

  try {
    const result = parseExpression();

    if (position !== tokens.length || !Number.isFinite(result)) {
      return "I couldn't solve that maths expression.";
    }

    return String(Number(result.toPrecision(12)));
  } catch (error) {
    if (error.message === "DIVISION_BY_ZERO") {
      return "You can't divide by zero!";
    }

    return "I couldn't solve that maths expression.";
  }
}

function getBotData(message) {
  const mathAnswer = solveMath(message);

  if (mathAnswer !== null) {
    return 'The answer is ' + mathAnswer;
  }

  const input = message
    .toLowerCase()
    .trim()
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ");

  let bestMatch = null;
  let bestLength = 0;

  for (const [categoryName, category] of Object.entries(botData)) {
    if (!Array.isArray(category)) continue;

    for (const item of category) {
      if (!Array.isArray(item.patterns) || !Array.isArray(item.response)) {
        continue;
      }

      for (const pattern of item.patterns) {
        const cleanedPattern = pattern
          .toLowerCase()
          .trim()
          .replace(/[^\w\s']/g, "")
          .replace(/\s+/g, " ");

        const escapedPattern = cleanedPattern.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );

        const patternRegex = new RegExp(`(^|\\s)${escapedPattern}(?=\\s|$)`);

        if (input === cleanedPattern) {
          bestMatch = item;
          bestLength = Infinity;
          break;
        }

        if (
          bestLength !== Infinity &&
          patternRegex.test(input) &&
          cleanedPattern.length > bestLength
        ) {
          bestMatch = item;
          bestLength = cleanedPattern.length;
        }
      }

      if (bestLength === Infinity) break;
    }

    if (bestLength === Infinity) break;
  }

  if (bestMatch) {
    return bestMatch.response[
      Math.floor(Math.random() * bestMatch.response.length)
    ];
  }

  return botData.fallback;
}

renderPreviousChats();
activeButton();

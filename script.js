const API_KEY = 'AIzaSyA5WbRpMwd7T0LTZzVMfXylJZQJ5Z1FTtc'; // Ganti dengan API key dari Google AI

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const chatContainer = document.querySelector('.chat-container');
const resizeHandle = document.querySelector('.resize-handle');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const sendBtn = document.getElementById('send-btn');

let isLoading = false;

// Theme handling
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  hideWelcomeMessage();
});

function hideWelcomeMessage() {
  const welcomeMessage = document.querySelector('.welcome-message');
  if (chatBox.children.length > 1 && welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
}

// Resize handling
let isResizing = false;
let startX;
let startWidth;

function initResize() {
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.pageX;
    startWidth = parseInt(getComputedStyle(chatContainer).width, 10);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
  });
}

function handleMouseMove(e) {
  if (!isResizing) return;
  const width = startWidth + (e.pageX - startX);
  if (width >= 300 && width <= 800) {
    chatContainer.style.width = `${width}px`;
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot typing-message';
  typingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return typingDiv;
}

function removeTypingIndicator(typingElement) {
  if (typingElement && typingElement.parentNode) {
    typingElement.parentNode.removeChild(typingElement);
  }
}

async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText || isLoading) return;

  // Hide welcome message
  hideWelcomeMessage();

  // Tampilkan pesan user
  appendMessage(userText, 'user');
  userInput.value = '';
  
  // Set loading state
  isLoading = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  
  // Show typing indicator
  const typingIndicator = showTypingIndicator();

  // Panggil Gemini API
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" + API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }]
      })
    });

    const data = await response.json();
    const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, terjadi kesalahan.";
    
    // Remove typing indicator
    removeTypingIndicator(typingIndicator);
    
    appendMessage(botReply, 'bot');
  } catch (error) {
    console.error("Error:", error);
    
    // Remove typing indicator
    removeTypingIndicator(typingIndicator);
    
    appendMessage("Terjadi kesalahan saat menghubungi Gemini API.", 'bot');
  } finally {
    // Reset loading state
    isLoading = false;
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

function formatMessage(text) {
  // Handle code blocks first
  let formattedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    return `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
  });

  // Handle inline code
  formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Handle bold text
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle italic text
  formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle bullet points
  formattedText = formattedText.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  
  // Wrap bullet points in ul if they exist
  if (formattedText.includes('<li>')) {
    formattedText = `<ul>${formattedText}</ul>`;
  }

  // Auto-paragraph formatting
  formattedText = formattedText
    .split('\n\n')
    .map(paragraph => {
      // Skip if paragraph is already wrapped in HTML tags
      if (/^<(ul|pre|p|h[1-6])>/.test(paragraph.trim())) {
        return paragraph;
      }
      return `<p>${paragraph}</p>`;
    })
    .join('');

  return formattedText;
}

function appendMessage(message, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.innerHTML = formatMessage(message);
  
  div.appendChild(messageContent);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Initialize resize functionality
initResize();

// Focus input on load
window.addEventListener('load', () => {
  userInput.focus();
});

function toggleSize() {
    const container = document.querySelector('.chat-container');
    container.classList.toggle('expanded');
}
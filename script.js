// Configuration
const GEMINI_API_KEY = 'AIzaSyAi8bVXYr0lKSCeiTnLmvwdbZu504vRmNM'; // Get from Google AI Studio
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// DOM Elements
const customerMessage = document.getElementById('customerMessage');
const toneSelect = document.getElementById('toneSelect');
const upsellToggle = document.getElementById('upsellToggle');
const generateBtn = document.getElementById('generateBtn');
const loading = document.getElementById('loading');
const replyCard = document.getElementById('replyCard');
const generatedReply = document.getElementById('generatedReply');
const copyBtn = document.getElementById('copyBtn');
const upgradePrompt = document.getElementById('upgradePrompt');
const exampleBtns = document.querySelectorAll('.example-btn');

// Track usage (simple localStorage for demo)
let usageCount = localStorage.getItem('usageCount') ? parseInt(localStorage.getItem('usageCount')) : 0;

// Check if user is on free trial (first 5 uses)
function checkUsage() {
    if (usageCount >= 5) {
        upgradePrompt.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.5';
        return false;
    }
    return true;
}

// Generate prompt based on inputs
function generatePrompt(message, tone, includeUpsell) {
    const toneInstructions = {
        friendly: "Be warm, use emojis occasionally, be approachable and casual",
        professional: "Be formal, concise, and business-appropriate",
        enthusiastic: "Be energetic, use exclamation points, show excitement",
        empathetic: "Show understanding, acknowledge their concerns first"
    };

    let prompt = `As a sales assistant, generate a WhatsApp reply to this customer message: "${message}"

Tone: ${toneInstructions[tone]}

Key requirements:
- Address the customer's specific concerns
- Be persuasive but not pushy
- Keep it conversational and WhatsApp-appropriate
- Include a clear call-to-action`;

    if (includeUpsell) {
        prompt += "\n- Suggest one relevant premium option or add-on";
    }

    if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost') || message.toLowerCase().includes('expensive')) {
        prompt += "\n- Handle price objection by emphasizing value and offering alternatives";
    }

    if (message.toLowerCase().includes('think') || message.toLowerCase().includes('decide') || message.toLowerCase().includes('consider')) {
        prompt += "\n- Address hesitation by offering more information or a low-commitment option";
    }

    return prompt;
}

// Generate reply using Gemini API
async function generateReply() {
    if (!checkUsage()) return;

    const message = customerMessage.value.trim();
    if (!message) {
        alert('Please paste a customer message first!');
        return;
    }

    // Show loading, hide reply
    loading.style.display = 'block';
    replyCard.style.display = 'none';

    const prompt = generatePrompt(message, toneSelect.value, upsellToggle.checked);

    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            
            // Update UI
            generatedReply.textContent = reply;
            loading.style.display = 'none';
            replyCard.style.display = 'block';
            
            // Update usage
            usageCount++;
            localStorage.setItem('usageCount', usageCount.toString());
            
            // Update feature tags based on message
            updateFeatureTags(message);
        } else {
            throw new Error('No response generated');
        }
    } catch (error) {
        console.error('Error:', error);
        loading.style.display = 'none';
        alert('Sorry, something went wrong. Please try again.');
        
        // Fallback demo response
        generatedReply.textContent = getDemoResponse(message, toneSelect.value);
        replyCard.style.display = 'block';
    }
}

// Demo responses for testing without API
function getDemoResponse(message, tone) {
    if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
        return "I completely understand your concern about the price! 😊 The value really comes from our premium quality and 24/7 support. We actually have a special 15% discount for first-time customers, and I can also show you our starter package that might fit your budget better. Would you like to hear about both options?";
    } else if (message.toLowerCase().includes('stock')) {
        return "Great news! ✅ Yes, we have this item in stock and ready to ship. Plus, if you order today, I can include free express shipping. Shall I help you place the order?";
    } else if (message.toLowerCase().includes('think')) {
        return "Of course, take your time to think! 💭 In the meantime, would you like me to send you a detailed comparison with our other popular options? Many customers find that helps with their decision. Also, we have a 30-day money-back guarantee, so you can try risk-free!";
    } else {
        return "Thank you for reaching out! 🎉 I'd love to help you with this. Based on your interest, I recommend our premium package which includes exclusive features. Would you like to see a quick demo or hear about our current special offer?";
    }
}

// Update feature tags based on message content
function updateFeatureTags(message) {
    const tags = [];
    
    if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost') || message.toLowerCase().includes('expensive')) {
        tags.push('Objection Handling ✓');
    }
    
    if (upsellToggle.checked) {
        tags.push('Upsell Suggestions ✓');
    }
    
    tags.push(`${toneSelect.options[toneSelect.selectedIndex].text} Tone ✓`);
    
    const featureTags = document.getElementById('featureTags');
    featureTags.innerHTML = tags.map(tag => `<span class="feature-tag">${tag}</span>`).join('');
}

// Copy reply to clipboard
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedReply.textContent).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
});

// Example buttons
exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        customerMessage.value = btn.dataset.message;
    });
});

// Generate button click
generateBtn.addEventListener('click', generateReply);

// Enter key shortcut (Ctrl/Cmd + Enter)
customerMessage.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        generateReply();
    }
});

// Initialize

checkUsage();

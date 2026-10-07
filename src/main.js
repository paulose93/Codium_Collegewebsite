import './style.css';
import logoUrl from './assets/FISAT_LOGO .png';

// --- Splash Screen & Loading Animation ---
        window.addEventListener('load', () => {
            const flyingLogo = document.getElementById('flying-logo');
            if (!flyingLogo) return; // Exit if not on the home page

            const placeholder = document.getElementById('logo-placeholder');
            const splashBg = document.getElementById('splash-bg');
            const headerBar = document.getElementById('header-black-bar');
            const headerContent = document.getElementById('header-content');
            const headerTitle = document.getElementById('header-title');
            const mainBody = document.getElementById('main-body');

            // Force play just in case mobile auto-play policy blocks it initially
            const video = flyingLogo.querySelector('video');
            if (video) video.play().catch(e => console.log("Video Autoplay Blocked:", e));

            // Spin in the middle for 2 seconds
            setTimeout(() => {
                // Get exact coordinates of the header placeholder
                const targetRect = placeholder.getBoundingClientRect();
                
                // Animate to header placeholder using FLIP technique
                flyingLogo.style.transform = 'translate(0, 0)'; 
                flyingLogo.style.top = targetRect.top + 'px';
                flyingLogo.style.left = targetRect.left + 'px';
                flyingLogo.style.width = targetRect.width + 'px';
                flyingLogo.style.height = targetRect.height + 'px';
                flyingLogo.classList.remove('shadow-2xl');
                
                // Start showing the header bar shortly after it moves
                setTimeout(() => {
                    if (headerBar) headerBar.style.opacity = '1';
                    if (splashBg) splashBg.style.opacity = '0'; // Fade out the splash screen
                    
                    // Reveal the header content and unlock scrolling
                    setTimeout(() => {
                        if (headerContent) {
                            headerContent.style.opacity = '1';
                            headerContent.style.clipPath = 'inset(0 0%)';
                        }
                        if (headerTitle) headerTitle.style.opacity = '1';
                        if (mainBody) mainBody.classList.remove('overflow-hidden');
                        
                        // Clean up: replace video with static logo once it slots in
                        setTimeout(() => {
                            if (placeholder) {
                                placeholder.innerHTML = `<img src="${logoUrl}" alt="FISAT_LOGO" class="w-full h-full object-contain scale-[1.15]" />`;
                                placeholder.classList.remove('opacity-0');
                                placeholder.classList.add('bg-white', 'rounded-full', 'overflow-hidden', 'flex', 'items-center', 'justify-center');
                            }
                            if(flyingLogo) flyingLogo.remove();
                            if(splashBg) splashBg.remove();
                        }, 1200); // Wait for all CSS transitions to finish completely
                        
                    }, 400);
                }, 400);

            }, 2000); 
        });

        document.addEventListener('DOMContentLoaded', () => {
            
            // --- Theme Toggling Logic ---
            const themeToggleCheckbox = document.getElementById('themeToggleCheckbox');
            const htmlElement = document.documentElement;

            // Check system or saved preference
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            if (isDark) {
                htmlElement.classList.add('dark');
                if (themeToggleCheckbox) themeToggleCheckbox.checked = true;
            } else {
                htmlElement.classList.remove('dark');
                if (themeToggleCheckbox) themeToggleCheckbox.checked = false;
            }

            if (themeToggleCheckbox) {
                themeToggleCheckbox.addEventListener('change', (e) => {
                    const darkEnabled = e.target.checked;
                    if (darkEnabled) {
                        htmlElement.classList.add('dark');
                    } else {
                        htmlElement.classList.remove('dark');
                    }
                    localStorage.setItem('theme', darkEnabled ? 'dark' : 'light');
                });
            }


            // --- Intersection Observer for Scroll Animations ---
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -50px 0px', // Trigger slightly before it hits the bottom
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Add 'visible' class to trigger the CSS transition
                        entry.target.classList.add('visible');
                        // Optional: Unobserve after animating once
                        // observer.unobserve(entry.target); 
                    }
                });
            }, observerOptions);

            // Select all elements with the 'card-reveal' class
        const revealElements = document.querySelectorAll('.card-reveal');
        revealElements.forEach(el => observer.observe(el));
        
        // --- Chatbot Logic ---
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotContainer = document.getElementById('chatbot-container');
        const chatWindow = document.getElementById('chat-window');
        const closeChat = document.getElementById('close-chat');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const chatMessages = document.getElementById('chat-messages');

        let isChatOpen = false;
        let chatHistory = [];

        // Toggle Chat Window
        function toggleChat() {
            isChatOpen = !isChatOpen;
            if (isChatOpen) {
                chatbotContainer.classList.remove('hidden');
                // Trigger animation after removing hidden
                setTimeout(() => {
                    chatWindow.classList.remove('scale-95', 'opacity-0');
                    chatWindow.classList.add('scale-100', 'opacity-100');
                    chatbotToggle.innerHTML = '<i class="ph ph-x text-2xl"></i>';
                }, 10);
            } else {
                chatWindow.classList.remove('scale-100', 'opacity-100');
                chatWindow.classList.add('scale-95', 'opacity-0');
                chatbotToggle.innerHTML = '<i class="ph ph-chat-teardrop-text text-2xl"></i>';
                // Wait for animation to finish before hiding
                setTimeout(() => {
                    chatbotContainer.classList.add('hidden');
                }, 300);
            }
        }

        chatbotToggle.addEventListener('click', toggleChat);
        closeChat.addEventListener('click', toggleChat);

        // Handle sending messages
        async function sendMessage() {
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // 1. Add user message to UI
            appendMessage(userMessage, 'user');
            chatInput.value = '';
            
            // Show typing indicator
            const typingIndicatorId = appendTypingIndicator();

            try {
                // 2. Call Gemini API
                const aiResponse = await callGeminiAPI(userMessage);
                
                // Remove typing indicator
                removeElement(typingIndicatorId);
                
                // 3. Add AI response to UI
                appendMessage(aiResponse, 'ai');
            } catch (error) {
                console.error("Error calling Gemini API:", error);
                removeElement(typingIndicatorId);
                appendMessage("Sorry, I'm having trouble connecting right now. Please try again later.", 'ai', true);
            }
        }

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Helper to append messages to the chat window
        function appendMessage(text, sender, isError = false) {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('p-3', 'rounded-2xl', 'max-w-[85%]', 'break-words');
            
            if (sender === 'user') {
                msgDiv.classList.add('bg-[var(--accent)]', 'text-[var(--accent-text)]', 'rounded-tr-none', 'self-end');
            } else {
                msgDiv.classList.add('bg-[var(--bg-base)]', 'text-[var(--text-main)]', 'rounded-tl-none', 'self-start', 'border', 'border-[var(--border-light)]');
                if (isError) {
                    msgDiv.classList.add('text-red-500');
                }
            }
            
            // Format text (basic markdown support for bolding from Gemini)
            const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            msgDiv.innerHTML = formattedText;
            
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        }

        // Helper to show typing indicator
        function appendTypingIndicator() {
            const id = 'typing-' + Date.now();
            const msgDiv = document.createElement('div');
            msgDiv.id = id;
            msgDiv.classList.add('bg-[var(--bg-base)]', 'text-[var(--text-main)]', 'p-3', 'rounded-2xl', 'rounded-tl-none', 'self-start', 'w-16', 'border', 'border-[var(--border-light)]', 'flex', 'gap-1', 'justify-center', 'items-center');
            
            msgDiv.innerHTML = `
                <div class="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            `;
            
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return id;
        }

        function removeElement(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }

        // --- Gemini API Call ---
        async function callGeminiAPI(prompt) {
            const systemPrompt = `You are a helpful assistant for FISAT (Federal Institute of Science And Technology) engineering college in Kerala. 
            Keep your answers concise, friendly, and relevant to the college. 
            If asked about courses, mention B.Tech, M.Tech, MCA, and MBA. 
            If you don't know something specific, say you don't have that information but recommend checking the main website or contacting the administration.`;

            // Update chat history
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = {
                contents: chatHistory,
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                }
            };

            const apiKey = ""; // API key will be injected by Canvas
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

            // Implement basic exponential backoff for retries
            let retries = 0;
            const maxRetries = 3;
            const baseDelay = 1000;

            while (retries < maxRetries) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        if (response.status === 429) {
                             throw new Error('Rate limit exceeded');
                        }
                        throw new Error(`API error: ${response.status}`);
                    }

                    const result = await response.json();
                    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    
                    if (aiText) {
                         // Add AI response to history
                         chatHistory.push({ role: "model", parts: [{ text: aiText }] });
                         return aiText;
                    } else {
                         throw new Error('Unexpected API response structure');
                    }

                } catch (error) {
                    retries++;
                    if (retries >= maxRetries) {
                        throw error;
                    }
                    // Wait before retrying (exponential backoff)
                    const delay = baseDelay * Math.pow(2, retries - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    });

    // --- Parallax Scroll Fade & Header Shrink ---
    window.addEventListener('scroll', () => {
        const scrollOverlay = document.getElementById('scroll-overlay');
        if (scrollOverlay) {
            // Fade up to 0.85 opacity over the first 600px of scrolling
            const maxScroll = 600; 
            const opacity = Math.min(window.scrollY / maxScroll, 0.85);
            scrollOverlay.style.opacity = opacity;
        }

        // Header Shrink Logic
        const mainHeader = document.getElementById('main-header');
        const navContent = document.getElementById('header-content');
        
        if (mainHeader && navContent) {
            if (window.scrollY > 50) {
                // Scrolled: Compact Pill
                mainHeader.classList.add('pt-4', 'px-4');
                mainHeader.classList.remove('pt-0', 'px-0');
                
                navContent.classList.remove('w-full', 'rounded-none', 'px-4', 'sm:px-8', 'border-b', 'h-16', 'shadow-sm');
                navContent.classList.add('max-w-6xl', 'rounded-full', 'px-2', 'pl-4', 'sm:pl-6', 'border', 'h-14', 'shadow-lg');
            } else {
                // Top: Full Width
                mainHeader.classList.remove('pt-4', 'px-4');
                mainHeader.classList.add('pt-0', 'px-0');
                
                navContent.classList.remove('max-w-6xl', 'rounded-full', 'px-2', 'pl-4', 'sm:pl-6', 'border', 'h-14', 'shadow-lg');
                navContent.classList.add('w-full', 'rounded-none', 'px-4', 'sm:px-8', 'border-b', 'h-16', 'shadow-sm');
            }
        }
    });

    // --- Mobile Menu Logic ---
    document.addEventListener('DOMContentLoaded', () => {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuContent = document.getElementById('mobile-menu-content');
        const closeMobileMenuBtn = document.getElementById('close-mobile-menu');

        function openMobileMenu() {
            if (!mobileMenu || !mobileMenuContent) return;
            mobileMenu.classList.remove('opacity-0', 'invisible');
            mobileMenu.classList.add('opacity-100', 'visible');
            mobileMenuContent.classList.remove('-translate-x-full');
            mobileMenuContent.classList.add('translate-x-0');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        function closeMobileMenu() {
            if (!mobileMenu || !mobileMenuContent) return;
            mobileMenuContent.classList.remove('translate-x-0');
            mobileMenuContent.classList.add('-translate-x-full');
            
            // Wait for transform transition before hiding background
            setTimeout(() => {
                mobileMenu.classList.remove('opacity-100', 'visible');
                mobileMenu.classList.add('opacity-0', 'invisible');
                document.body.style.overflow = '';
            }, 300);
        }

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', openMobileMenu);
        }

        if (closeMobileMenuBtn) {
            closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
        }

        if (mobileMenu) {
            mobileMenu.addEventListener('click', (e) => {
                if (e.target === mobileMenu) {
                    closeMobileMenu();
                }
            });
        }
    });

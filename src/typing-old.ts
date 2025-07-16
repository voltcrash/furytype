// Import navigation bar functions
import { hideNavbar, showNavbar } from './animation';
// Import paragraphs data as raw text
import paragraphsData from './assets/data/paragraphs.txt?raw';

// Interfaces and types
interface Key {
    label: string;
    size: number;
}

interface WPMHistoryItem {
    time: number;
    wpm: number;
}

interface RaceData {
    sno: number;
    dateTime: string;
    duration: string;
    wpm: number;
    accuracy: string;
    paragraph: string;
}

interface ThemeColors {
    keyColor: string;
    pressedKeyColor: string;
    incorrectKeyColor: string;
    keyTextColor: string;
}

interface ThemeConfig {
    dark: ThemeColors;
    light: ThemeColors;
}

type Theme = 'dark' | 'light';

// Global state variables
let testText: string = "";
let currentIndex: number = 0;
let totalTime: number = 30;
let timeLeft: number = totalTime;
let correctChars: number = 0;
let totalChars: number = 0;
let timerInterval: number | null = null;
let timerStarted: boolean = false;
let startTime: number | null = null;
let wpmHistory: WPMHistoryItem[] = [];
let consistencyScores: number[] = [];
let lastCharacterTime: number | null = null;
let currentConsistency: number = 100;
let paragraphs: string[] = [];

// Canvas and keyboard state
const canvas = document.getElementById("keyboardCanvas") as HTMLCanvasElement;
const ctx = canvas?.getContext("2d");
if (canvas && ctx) {
    const scaleFactor = window.devicePixelRatio || 2;
    canvas.width = 750 * scaleFactor;
    canvas.height = 250 * scaleFactor;
    canvas.style.width = "750px";
    canvas.style.height = "250px";
    ctx.scale(scaleFactor, scaleFactor);
}

const keys: Key[][] = [[{label: "q", size: 1}, {label: "w", size: 1}, {label: "e", size: 1}, {label: "r", size: 1}, {
    label: "t", size: 1
}, {label: "y", size: 1}, {label: "u", size: 1}, {label: "i", size: 1}, {label: "o", size: 1}, {
    label: "p", size: 1
}, {label: "[", size: 1}, {label: "]", size: 1}], [{label: "a", size: 1}, {label: "s", size: 1}, {
    label: "d", size: 1
}, {label: "f", size: 1}, {label: "g", size: 1}, {label: "h", size: 1}, {label: "j", size: 1}, {
    label: "k", size: 1
}, {label: "l", size: 1}, {label: ";", size: 1}, {label: "'", size: 1}], [{label: "z", size: 1}, {
    label: "x", size: 1
}, {label: "c", size: 1}, {label: "v", size: 1}, {label: "b", size: 1}, {label: "n", size: 1}, {
    label: "m", size: 1
}, {label: ",", size: 1}, {label: ".", size: 1}, {label: "/", size: 1}], [{label: "space", size: 6.25}]];

const keyWidth: number = 50;
const keyHeight: number = 50;
const keySpacing: number = 8;
const startY: number = 20;
const radius: number = 20;
let pressedKeys: Set<string> = new Set();
let incorrectKeys: Set<string> = new Set();
export let currentTheme: Theme = "dark";
let shiftPressed: boolean = false;

// Add fallback paragraphs
const fallbackParagraphs: string[] = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once.",
    "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell.",
    "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    "To be or not to be, that is the question. Whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
    "Call me Ishmael. Some years ago never mind how long precisely having little or no money in my purse and nothing particular to interest me on shore."
];

// Export the main initialization function
export function initializeTypingTest(): void {
    // Set up event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    // Initialize when fonts are ready
    document.fonts.ready.then(() => {
        fetchParagraphs();
        drawKeyboard(currentTheme);
    });
}

function fetchParagraphs(): void {
    try {
        const fetchedParagraphs = paragraphsData.split("\n").filter((line: string) => line.trim() !== "");
        if (fetchedParagraphs.length > 0) {
            paragraphs = fetchedParagraphs;
        } else {
            paragraphs = fallbackParagraphs;
        }
    } catch (error) {
        console.error("Error loading paragraphs:", error);
        paragraphs = fallbackParagraphs;
    }
    testText = getRandomParagraph();
    initializeTypingTestUI();
}

function initializeTypingTestUI(): void {
    currentIndex = 0;
    correctChars = 0;
    totalChars = 0;
    timeLeft = totalTime;
    updateMetrics(0, 100, 0);
    wpmHistory = [];
    consistencyScores = [];
    startTime = null;
    lastCharacterTime = null;
    currentConsistency = 100;
    const timeBar = document.getElementById("timeBar") as HTMLElement;
    timeBar.style.visibility = "hidden";
    timeBar.style.width = "100%";
    const typeTest = document.getElementById("typeTest") as HTMLElement;
    typeTest.innerHTML = "";
    testText.split("").forEach((char: string) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.classList.add("untyped");
        typeTest.appendChild(span);
    });
    const caret = document.createElement("div");
    caret.classList.add("caret");
    typeTest.appendChild(caret);
    updateCaretPosition(caret, typeTest.querySelector("span.untyped") as HTMLSpanElement);
    const typingMetrics = document.createElement("div");
    typingMetrics.id = "typingMetrics";
    typingMetrics.innerHTML = `
        <span id="wpm">0wpm</span> <span id="accuracy">0%acc</span>  <span id="rawWpm">0raw</span>
    `;
    typingMetrics.style.position = "absolute";
    typingMetrics.style.top = "-55px";
    typingMetrics.style.left = "0";
    typeTest.appendChild(typingMetrics);
    typingMetrics.classList.remove("visible");
    document.removeEventListener("keydown", handleTyping);
    document.addEventListener("keydown", handleTyping);
}

function getRandomParagraph(): string {
    if (paragraphs.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * paragraphs.length);
    return paragraphs[randomIndex];
}

const highlightTimeouts: Record<string, number> = {};
let pressedKey: string | null = null;

function handleTyping(event: KeyboardEvent): void {
    const validKeyRegex = /^[a-zA-Z0-9 .,;'/[\]\\\-_=+{}|:>?<()*&^!@#$%~`"]$/;
    const typedChar = event.key;
    if (!validKeyRegex.test(typedChar) && event.key !== "Backspace" || event.metaKey) {
        return;
    }
    // Prevent default browser behavior for valid typing characters
    event.preventDefault();
    
    if (typedChar === pressedKey) {
        return;
    }
    pressedKey = typedChar;
    if (!timerStarted && validKeyRegex.test(typedChar) && typedChar !== " " && typedChar !== "Backspace") {
        startTimer();
        timerStarted = true;
        startTime = (new Date()).getTime();
        lastCharacterTime = (new Date()).getTime();
        const timeBar = document.getElementById("timeBar") as HTMLElement;
        timeBar.style.visibility = "visible";
        startMetricUpdater();
        // Hide navigation bar when typing starts
        hideNavbar();
    }
    const typeTest = document.getElementById("typeTest") as HTMLElement;
    const spans = typeTest.querySelectorAll("span") as NodeListOf<HTMLSpanElement>;
    const caret = typeTest.querySelector(".caret") as HTMLElement;
    if (typedChar === "Backspace") {
        if (event.ctrlKey || event.altKey || event.metaKey) {
            deletePreviousWord(spans, caret);
        } else if (currentIndex > 0) {
            currentIndex--;
            spans[currentIndex].classList.remove("correct", "incorrect");
            spans[currentIndex].classList.add("untyped");
            if (caret && spans[currentIndex]) {
                updateCaretPosition(caret, spans[currentIndex]);
            }
        }
        return;
    }
    if (currentIndex >= testText.length) return;
    totalChars++;

    function highlightKey(key: string, isCorrect: boolean): void {
        const normalizedKey = key.toLowerCase();
        const keyMap: Record<string, string> = {" ": "space", ".": ".", ",": ",", ";": ";", "'": "'", "/": "/", "[": "[", "]": "]"};
        const displayKey = keyMap[normalizedKey] || normalizedKey;
        if (highlightTimeouts[displayKey]) {
            clearTimeout(highlightTimeouts[displayKey]);
            delete highlightTimeouts[displayKey];
        }
        if (!isCorrect) {
            incorrectKeys.add(displayKey);
            pressedKeys.delete(displayKey);
        } else {
            if (!incorrectKeys.has(displayKey)) {
                pressedKeys.add(displayKey);
            }
        }
        drawKeyboard(currentTheme);
        highlightTimeouts[displayKey] = setTimeout(() => {
            if (isCorrect) {
                pressedKeys.delete(displayKey);
            } else {
                incorrectKeys.delete(displayKey);
            }
            delete highlightTimeouts[displayKey];
            drawKeyboard(currentTheme);
        }, 175);
    }

    const currentChar = testText[currentIndex];
    if (typedChar === currentChar) {
        correctChars++;
        spans[currentIndex].classList.replace("untyped", "correct");
        highlightKey(typedChar, true);
        currentIndex++;
    } else if (typedChar.length === 1) {
        spans[currentIndex].classList.replace("untyped", "incorrect");
        highlightKey(typedChar, false);
        currentIndex++;
    }
    if (currentIndex < testText.length) {
        if (caret && spans[currentIndex]) {
            updateCaretPosition(caret, spans[currentIndex]);
        }
    } else if (currentIndex === testText.length) {
        endTypingTest();
    }
    if (startTime) {
        const now = (new Date()).getTime();
        const elapsedTime = (now - startTime) / 1000;
        const wpm = calculateWPM(correctChars, elapsedTime);
        wpmHistory.push({time: totalTime - timeLeft, wpm: wpm});
        if (lastCharacterTime) {
            const timeSinceLastChar = (now - lastCharacterTime) / 1000;
            consistencyScores.push(timeSinceLastChar);
            currentConsistency = calculateConsistency();
        }
        lastCharacterTime = now;
    }
}

function deletePreviousWord(spans: NodeListOf<HTMLSpanElement>, caret: HTMLElement): void {
    if (currentIndex <= 0) return;
    let initialIndex = currentIndex;
    while (currentIndex > 0 && testText[currentIndex - 1] === " ") {
        currentIndex--;
    }
    while (currentIndex > 0 && testText[currentIndex - 1] !== " ") {
        currentIndex--;
    }
    for (let i = initialIndex - 1; i >= currentIndex; i--) {
        spans[i].classList.remove("correct", "incorrect");
        spans[i].classList.add("untyped");
    }
    if (caret && spans[currentIndex]) {
        updateCaretPosition(caret, spans[currentIndex]);
    }
}

document.addEventListener("keyup", (event: KeyboardEvent) => {
    if (event.key === pressedKey) {
        pressedKey = null;
    }
});

function startTimer(): void {
    const timeBar = document.getElementById("timeBar") as HTMLElement;
    timeBar.style.visibility = "visible";
    timerInterval = window.setInterval(() => {
        timeLeft--;
        const progress = timeLeft / totalTime * 100;
        timeBar.style.width = `${progress}%`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval!);
            endTypingTest();
        }
    }, 1000);
}

function updateCaretPosition(caret: HTMLElement, targetSpan: HTMLSpanElement): void {
    if (caret && targetSpan) {
        caret.style.left = `${targetSpan.offsetLeft}px`;
        caret.style.top = `${targetSpan.offsetTop + 2.5}px`;
    }
}

function calculateWPM(correctChars: number, elapsedTime: number): number {
    if (elapsedTime <= 0 || correctChars === 0) return 0;
    const wordsTyped = Math.floor(correctChars / 5);
    return Math.round(wordsTyped / (elapsedTime / 60));
}

function calculateAccuracy(correctChars: number, totalChars: number): number {
    if (totalChars === 0) return 100;
    return Math.round(correctChars / totalChars * 100);
}

function updateMetrics(wpm: number, accuracy: number, rawWpm: number): void {
    let typingMetrics = document.getElementById("typingMetrics") as HTMLElement;
    if (!typingMetrics) {
        typingMetrics = document.createElement("div");
        typingMetrics.id = "typingMetrics";
        typingMetrics.style.position = "absolute";
        typingMetrics.style.top = "-55px";
        typingMetrics.style.left = "0";
        const typeTest = document.getElementById("typeTest");
        if (typeTest) typeTest.appendChild(typingMetrics);
    }
    if (!typingMetrics.classList.contains("visible")) {
        typingMetrics.classList.add("visible");
    }
    typingMetrics.innerHTML = `
        <span id="wpm">${wpm}wpm</span> <span id="accuracy">${accuracy}%acc</span> <span id="rawWpm">${rawWpm}raw</span>
    `;
}

let metricUpdaterInterval: number | null = null;

function startMetricUpdater(): void {
    metricUpdaterInterval = window.setInterval(() => {
        if (startTime) {
            const elapsedTime = ((new Date()).getTime() - startTime) / 1000;
            const wpm = calculateWPM(correctChars, elapsedTime);
            const accuracy = calculateAccuracy(correctChars, totalChars);
            const rawWpm = Math.round(totalChars / elapsedTime * 60 * 0.2);
            updateMetrics(wpm, accuracy, rawWpm);
        }
    }, 100);
}

function endTypingTest(): void {
    clearInterval(timerInterval!);
    clearInterval(metricUpdaterInterval!);
    
    // Show navigation bar when typing ends
    showNavbar();

    const typeTest = document.getElementById('typeTest');
    if (typeTest) {
        typeTest.style.display = 'none';
    }

    let resultScreen = document.getElementById('resultScreen') as HTMLElement;
    if (!resultScreen) {
        resultScreen = document.createElement('div');
        resultScreen.id = 'resultScreen';
        resultScreen.classList.add('result-screen');
        document.body.appendChild(resultScreen);
    }

    const wpm = calculateWPM(correctChars, totalTime - timeLeft);
    const accuracy = calculateAccuracy(correctChars, totalChars);
    const typedParagraph = testText;
    const resultTime = totalTime - timeLeft;
    const numCorrect = correctChars;
    const numIncorrect = totalChars - correctChars;
    const numUntyped = testText.length - totalChars;
    const rawWpm = Math.round(totalChars / resultTime * 60 * 0.2).toFixed(2);
    currentConsistency = calculateConsistency();

    const raceData: RaceData = {
        sno: new Date().getTime(), // Unique serial number (timestamp)
        dateTime: new Date().toISOString(),
        duration: `${resultTime.toFixed(2)}`,
        wpm: wpm,
        accuracy: `${accuracy}`,
        paragraph: typedParagraph
    };

    // Send race data to the server
    sendRaceData(raceData);

    resultScreen.innerHTML = `
         <h2>test complete</h2>
        <div class="main-result">
                ${wpm}<span>wpm</span> | ${accuracy}<span>%acc</span>
          </div>
        <div class="metrics-container">
            <div class="metric">
                raw
                <span>${rawWpm}</span>
            </div>
             <div class="metric">
                characters
                <span>${numCorrect}/${numIncorrect}/${numUntyped}</span>
            </div>
             <div class="metric">
                consistency
                <span>${currentConsistency.toFixed(2)}%</span>
            </div>
             <div class="metric">
                time
                <span>${resultTime.toFixed(2)}s</span>
            </div>
             <canvas id="resultGraph"></canvas>

        </div>
         <button class="retry-button">></button>
    `;
    drawGraph();


    const tryAgainButton = document.querySelector('.retry-button') as HTMLButtonElement;
    tryAgainButton.addEventListener('click', resetTestState);
    const typingMetrics = document.getElementById("typingMetrics");
    if (typingMetrics) {
        typingMetrics.remove();
    }
}

function sendRaceData(raceData: RaceData): void {
    fetch('/record-race', {
        method: 'POST', headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify(raceData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Race result recorded:', data.message);
        })
        .catch(error => {
            console.error('Error sending race result:', error);
        });
}

function calculateConsistency(): number {
    if (consistencyScores.length < 2) return 100;
    let averageConsistencyDifference = 0;
    for (let i = 1; i < consistencyScores.length; i++) {
        const currentChange = Math.abs(consistencyScores[i] - consistencyScores[i - 1]);
        averageConsistencyDifference = averageConsistencyDifference * 0.9 + currentChange * 0.1;
    }
    const standardPercentage = Math.max(0, 100 - averageConsistencyDifference * 200);
    let modifiedPercentage: number;
    if (standardPercentage < 20) {
        modifiedPercentage = Math.round(standardPercentage * 0.4);
    } else {
        modifiedPercentage = Math.round(standardPercentage);
    }
    return Math.max(0, Math.min(100, modifiedPercentage));
}

function resetTestState(): void {
    try {
        currentIndex = 0;
        correctChars = 0;
        totalChars = 0;
        timerStarted = false;
        timeLeft = totalTime;
        startTime = null;
        lastCharacterTime = null;
        consistencyScores = [];
        currentConsistency = 100;
        
        // Show navigation bar when test is reset
        showNavbar();
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (metricUpdaterInterval) {
            clearInterval(metricUpdaterInterval);
            metricUpdaterInterval = null;
        }
        const resultScreen = document.getElementById("resultScreen") as HTMLElement;
        if (resultScreen) {
            resultScreen.classList.add("fadeOut");
            resultScreen.addEventListener("animationend", () => {
                if (resultScreen.parentNode) {
                    resultScreen.remove();
                }
            }, {once: true});
        }
        const typeTest = document.getElementById("typeTest") as HTMLElement;
        if (typeTest) {
            typeTest.style.display = "block";
        }
        testText = getRandomParagraph();
        initializeTypingTestUI();
    } catch (error) {
        console.error("Error resetting test state:", error);
    }
}

// Export the drawKeyboard function for use in animation.js
export function drawKeyboard(theme: Theme): void {
    currentTheme = theme; // Update the current theme
    
    if (!canvas || !ctx) return;
    
    document.fonts.ready.then(() => {
        ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 2), canvas.height / (window.devicePixelRatio || 2));
        const themeColors: ThemeConfig = {
            dark: {
                keyColor: "rgb(28,28,28)",
                pressedKeyColor: "rgb(76,62,50)",
                incorrectKeyColor: "rgb(178,89,89)",
                keyTextColor: "rgb(160,160,160)"
            }, light: {
                keyColor: "rgb(227,227,227)",
                pressedKeyColor: "rgb(255,199,153)",
                incorrectKeyColor: "rgb(178,89,89)",
                keyTextColor: "rgb(160,160,160)"
            }
        };
        let y = startY;
        keys.forEach((row: Key[]) => {
            let totalRowWidth = 0;
            row.forEach(({size}: Key) => {
                totalRowWidth += keyWidth * size + keySpacing;
            });
            totalRowWidth -= keySpacing;
            let x = (canvas.width / (window.devicePixelRatio || 2) - totalRowWidth) / 2;
            row.forEach(({label, size}: Key) => {
                const width = keyWidth * size;
                const height = keyHeight;
                const keyColor = themeColors[theme].keyColor;
                const pressedKeyColor = themeColors[theme].pressedKeyColor;
                const incorrectKeyColor = themeColors[theme].incorrectKeyColor;
                const keyTextColor = themeColors[theme].keyTextColor;
                let keyFillColor = keyColor;
                if (incorrectKeys.has(label)) {
                    keyFillColor = incorrectKeyColor;
                } else if (pressedKeys.has(label)) {
                    keyFillColor = pressedKeyColor;
                }
                ctx.fillStyle = keyFillColor;
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, radius);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = keyTextColor;
                ctx.font = '16px "Ubuntu Sans Mono"';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const displayLabel = shiftPressed ? label.toUpperCase() : label;
                ctx.fillText(displayLabel, x + width / 2, y + keyHeight / 2);
                x += width + keySpacing;
            });
            y += keyHeight + keySpacing;
        });
    });
}

// Export function to update theme from animation module
export function updateTheme(theme: Theme): void {
    drawKeyboard(theme);
}

function handleKeyDown(event: KeyboardEvent): void {
    let key = event.key.toLowerCase();
    if (key === " ") key = "space";
    if (event.key === "Shift") {
        shiftPressed = true;
        drawKeyboard(currentTheme);
    }
}

function handleKeyUp(event: KeyboardEvent): void {
    let key = event.key.toLowerCase();
    if (key === " ") key = "space";
    if (event.key === "Shift") {
        shiftPressed = false;
        drawKeyboard(currentTheme);
    }
}


function drawGraph(): void {
    const graphCanvas = document.getElementById("resultGraph") as HTMLCanvasElement;
    const ctx = graphCanvas.getContext("2d")!;
    const scaleFactor = window.devicePixelRatio || 2;
    graphCanvas.width = 500 * scaleFactor;
    graphCanvas.height = 150 * scaleFactor;
    graphCanvas.style.width = "500px";
    graphCanvas.style.height = "150px";
    ctx.scale(scaleFactor, scaleFactor);
    const padding = 15;
    const graphWidth = graphCanvas.width / scaleFactor - 2 * padding;
    const graphHeight = graphCanvas.height / scaleFactor - 2 * padding;
    if (wpmHistory.length === 0) return;
    const maxWpm = Math.max(...wpmHistory.map((item: WPMHistoryItem) => item.wpm), 10);
    const themeColors: ThemeConfig = {
        dark: {graphBackgroundColor: "rgb(10, 10, 10)", graphLineColor: "rgb(255, 199, 153)"},
        light: {graphBackgroundColor: "rgb(255,255,255)", graphLineColor: "rgb(255,140,0)"}
    } as any;
    ctx.fillStyle = (themeColors[currentTheme] as any).graphBackgroundColor;
    ctx.fillRect(0, 0, graphCanvas.width / scaleFactor, graphCanvas.height / scaleFactor);
    ctx.beginPath();
    ctx.strokeStyle = (themeColors[currentTheme] as any).graphLineColor;
    ctx.lineWidth = 2;
    const xIncrement = graphWidth / (wpmHistory.length - 1);
    let x = padding;
    ctx.moveTo(x, graphHeight - wpmHistory[0].wpm / maxWpm * graphHeight + padding);
    for (let i = 1; i < wpmHistory.length; i++) {
        const y = graphHeight - wpmHistory[i].wpm / maxWpm * graphHeight + padding;
        ctx.lineTo(x, y);
        x += xIncrement;
    }
    ctx.stroke();
} 
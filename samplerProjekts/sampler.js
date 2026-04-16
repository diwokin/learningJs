const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const pads = {
    kick: { element: document.getElementById('kick'), buffer: null },
    snare: { element: document.getElementById('snare'), buffer: null },
    hihat: { element: document.getElementById('hihat'), buffer: null }
};

let isPlaying = false;
let currentStep = 0;
let nextStepTime = 0;
const tempo = 120.0; 
const lookahead = 25.0; // How often to check for new notes (ms)
const scheduleAheadTime = 0.1; // How far to schedule notes (s)

// --- RECORDING LOGIC ---
async function setupMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    Object.keys(pads).forEach(key => {
        const pad = pads[key];
        let mediaRecorder;
        let chunks = [];

        pad.element.onmousedown = () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            mediaRecorder = new MediaRecorder(stream);
            chunks = [];
            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
                const arrayBuffer = await blob.arrayBuffer();
                pad.buffer = await audioCtx.decodeAudioData(arrayBuffer);
                pad.element.classList.add('has-sound');
            };
            mediaRecorder.start();
            pad.element.classList.add('recording');
        };

        pad.element.onmouseup = () => {
            mediaRecorder.stop();
            pad.element.classList.remove('recording');
        };
    });
}

// --- SEQUENCER LOGIC ---
function playSound(buffer, time) {
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(time);
}

function scheduler() {
    while (nextStepTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(currentStep, nextStepTime);
        advanceNote();
    }
    if (isPlaying) setTimeout(scheduler, lookahead);
}

function advanceNote() {
    const secondsPerBeat = 60.0 / tempo / 2; // 8th notes
    nextStepTime += secondsPerBeat;
    currentStep = (currentStep + 1) % 8; // 8-step loop
}

function scheduleNote(step, time) {
    // Basic 4/4 Beat Logic:
    // Kick on 0 and 4
    if ((step === 0 || step === 4) && pads.kick.buffer) playSound(pads.kick.buffer, time);
    // Snare on 2 and 6
    if ((step === 2 || step === 6) && pads.snare.buffer) playSound(pads.snare.buffer, time);
    // Hi-hat on every step
    if (pads.hihat.buffer) playSound(pads.hihat.buffer, time);
}

document.getElementById('playBtn').onclick = () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        currentStep = 0;
        nextStepTime = audioCtx.currentTime;
        scheduler();
        document.getElementById('playBtn').innerText = "STOP BEAT";
    } else {
        document.getElementById('playBtn').innerText = "START BEAT";
    }
};

setupMic();
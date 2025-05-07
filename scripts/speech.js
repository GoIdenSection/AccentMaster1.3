export default class SpeechManager {
    constructor(language = 'fr-FR') {
        this.language = language;
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.recognition = this.initRecognition();
    }

    initRecognition() {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            throw new Error('Taligenkänning stöds inte i denna webbläsare');
        }

        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new Recognition();
        
        recognition.lang = this.language;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        return recognition;
    }

    speak(text) {
        return new Promise((resolve, reject) => {
            try {
                this.stop();
                this.utterance = new SpeechSynthesisUtterance(text);
                this.utterance.lang = this.language;
                this.utterance.rate = 0.9;
                
                this.utterance.onend = () => resolve();
                this.utterance.onerror = (event) => reject(event.error);
                
                this.synth.speak(this.utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    record() {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                reject(new Error('Taligenkänning inte tillgänglig'));
                return;
            }

            this.recognition.abort(); // Avbryt eventuell pågående inspelning

            const handleResult = (event) => {
                const result = event.results[0][0];
                resolve(result.transcript.trim());
                cleanup();
            };

            const handleError = (event) => {
                reject(new Error(`Inspelningsfel: ${event.error}`));
                cleanup();
            };

            const cleanup = () => {
                this.recognition.removeEventListener('result', handleResult);
                this.recognition.removeEventListener('error', handleError);
                this.recognition.abort();
            };

            this.recognition.addEventListener('result', handleResult);
            this.recognition.addEventListener('error', handleError);
            this.recognition.start();
        });
    }

    stop() {
        if (this.synth && this.synth.speaking) {
            this.synth.cancel();
        }
        if (this.recognition) {
            this.recognition.abort();
        }
    }

    setLanguage(language) {
        this.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }
}


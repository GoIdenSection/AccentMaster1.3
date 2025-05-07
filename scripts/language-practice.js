import AccentMaster from './app.js';
import PronunciationEvaluator from './evaluation.js';
import SpeechManager from './speech.js';

class LanguagePractice {
    constructor(langCode) {
        this.langCode = langCode.toLowerCase();
        const languageMap = {
            en: 'en-US',
            fr: 'fr-FR', 
            de: 'de-DE',
            es: 'es-ES',
            it: 'it-IT'
        };
        this.fullLangCode = languageMap[this.langCode];
        this.accentMaster = new AccentMaster(this.fullLangCode);
        this.evaluator = new PronunciationEvaluator(this.fullLangCode);
        this.speech = new SpeechManager(this.fullLangCode);
        this.currentWord = null;

        this.init().catch(error => {
            this.showError(`Systemfel: ${error.message}`);
        });
    }

    async init() {
        await this.accentMaster.init();
        this.setupEventListeners();
        this.updateDisplay();
    }

    async loadWordBank() {
        this.showLoading(true);
        try {
            const module = await import(`../word-banks/${this.langCode}.js`);
            this.accentMaster.wordBank = module.default;
            this.accentMaster.prepareWordBank();
        } catch (error) {
            this.showError('Kunde inte ladda ordlistan');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        const elements = {
            play: document.getElementById('playButton'),
            record: document.getElementById('recordButton'),
            prev: document.getElementById('prevButton'),
            next: document.getElementById('nextButton'),
            reset: document.getElementById('resetButton')
        };

        if (!elements.play || !elements.record || !elements.prev || !elements.next || !elements.reset) {
            this.showError('Vissa knappar saknas i gränssnittet');
            return;
        }
        elements.reset.addEventListener('click', () => this.resetProgress());
        elements.play.addEventListener('click', () => this.playWord());
        elements.record.addEventListener('click', () => this.startRecording());
        elements.prev.addEventListener('click', () => this.previousWord());
        elements.next.addEventListener('click', () => this.nextWord());
        document.getElementById('resetButton').addEventListener('click', () => this.resetProgress());
    }

    async playWord() {
        try {
            if (!this.currentWord) {
                this.currentWord = this.accentMaster.getNextWord();
                document.getElementById('currentWord').textContent = this.currentWord;
            }
            
            await this.speech.speak(this.currentWord);
            document.getElementById('feedback').textContent = 'Uppspelning lyckades!';
            document.getElementById('feedback').style.color = 'green';
        } catch (error) {
            console.error('Uppspelningsfel:', error);
            document.getElementById('feedback').textContent = 'Kunde inte spela upp ljud';
            document.getElementById('feedback').style.color = 'red';
        }
    }

    async startRecording() {
        try {
            const attempt = await this.speech.record();
            const score = this.evaluator.evaluate(this.currentWord, attempt);
            this.handleAttemptResult(score);
        } catch (error) {
            this.showError('Inspelning misslyckades: ' + error.message);
        }
    }

    handleAttemptResult(score) {
        document.getElementById('scoreDisplay').textContent = `${score}%`;
        document.getElementById('starsCount').textContent = this.accentMaster.userProgress.stars;
        
        const feedbackElement = document.getElementById('feedback');
        if (score >= 75) {
            feedbackElement.textContent = this.getSuccessMessage();
            feedbackElement.style.color = '#2ecc71';
            this.accentMaster.handleSuccess(this.currentWord);
        } else {
            feedbackElement.textContent = this.getTryAgainMessage();
            feedbackElement.style.color = '#e74c3c';
            this.accentMaster.handleFailure(this.currentWord);
        }
        
        this.updateProgress();
    }

    getSuccessMessage() {
        const messages = {
            en: '🎉 Excellent!',
            fr: '🎉 Parfait !',
            es: '🎉 ¡Perfecto!',
            de: '🎉 Ausgezeichnet!',
            it: '🎉 Perfetto!'
        };
        return messages[this.langCode] || '🎉 Bra jobbat!';
    }

    getTryAgainMessage() {
        const messages = {
            en: '🔊 Try again',
            fr: '🔊 Essaie encore, Try again',
            es: '🔊 Intenta de nuevo, Try again',
            de: '🔊 Nochmal versuchen, Try again',
            it: '🔊 Riprova,Try again'
        };
        return messages[this.langCode] || '🔊 Försök igen';
    }

    nextWord() {
        this.currentWord = this.accentMaster.getNextWord();
        const wordElement = document.getElementById('currentWord');
        
        wordElement.textContent = this.currentWord || this.getNoMoreWordsMessage();
        wordElement.classList.add('word-highlight');
        
        setTimeout(() => {
            wordElement.classList.remove('word-highlight');
        }, 500);

        this.resetFeedback();
        this.updateProgress();
    }

    getNoMoreWordsMessage() {
        const messages = {
            en: '🎉 Level completed!',
            fr: '🎉 Niveau terminé !, Level completed!',
            es: '🎉 ¡Nivel completado!, Level completed!',
            de: '🎉 Level abgeschlossen!, Level completed!',
            it: '🎉 Livello completato!,Level completed!'
        };
        return messages[this.langCode] || '🎉 Nivå avklarad!';
    }

    previousWord() {
        const words = this.accentMaster.userProgress.activeWords;
        const currentIndex = words.findIndex(w => w.word === this.currentWord);
        
        if (currentIndex > 0) {
            this.currentWord = words[currentIndex - 1].word;
            this.updateWordDisplay();
        }
    }

    updateWordDisplay() {
        const wordElement = document.getElementById('currentWord');
        wordElement.textContent = this.currentWord;
        this.resetFeedback();
    }

    updateProgress() {
        // Kontrollera att alla element finns
        const elements = {
            progressBar: document.getElementById('progressBar'),
            currentLevel: document.getElementById('currentLevel'),
            progressPercentage: document.getElementById('progressPercentage'),
            starsCount: document.getElementById('starsCount')
        };
    
        // Visa fel om element saknas
        for (const [name, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`Element med ID '${name}' saknas!`);
                return;
            }
        }
    
        // Hämta och uppdatera progress
        const progress = this.accentMaster.getProgress();
        
        // Uppdatera UI
        elements.progressBar.style.width = `${progress.percentage}%`;
        elements.currentLevel.textContent = this.getLevelText(progress.level);
        elements.progressPercentage.textContent = 
            `${Math.round(progress.percentage)}% ${this.getCompletedText()}`;
        elements.starsCount.textContent = this.accentMaster.userProgress.stars;
    }

    getLevelText(level) {
        const levels = {
            easy: { en: 'Easy', fr: 'Débutant', es: 'Principiante', de: 'Einfach', it: 'Principiante' },
            medium: { en: 'Medium', fr: 'Intermédiaire', es: 'Intermedio', de: 'Mittel', it: 'Intermedio' },
            hard: { en: 'Hard', fr: 'Avancé', es: 'Avanzado', de: 'Schwer', it: 'Avanzato' }
        };
        return levels[level][this.langCode] || level;
    }

    getCompletedText() {
        const texts = {
            en: 'completed',
            fr: 'complété',
            es: 'completado',
            de: 'abgeschlossen',
            it: 'completato'
        };
        return texts[this.langCode] || 'avklarat';
    }

    resetFeedback() {
        document.getElementById('feedback').textContent = '';
        document.getElementById('scoreDisplay').textContent = '0%';
    }

    showLoading(show) {
        const loader = document.getElementById('loadingOverlay');
        if (loader) loader.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 5000);
    }
    resetProgress() {
        if (confirm("Raderar endast progress för detta språk. Vill du fortsätta?")) {
            localStorage.removeItem(`accentMaster_${this.fullLangCode}`);
            this.accentMaster.initializeNewUser();
            this.updateProgress();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const langCode = document.body.dataset.lang;
    if (langCode) {
        try {
            new LanguagePractice(langCode);
        } catch (error) {
            console.error('Startfel:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.textContent = `Startfel: ${error.message}`;
            document.body.prepend(errorDiv);
        }
    } else {
        console.error('Språkkod saknas i data-lang attribut');
    }
});
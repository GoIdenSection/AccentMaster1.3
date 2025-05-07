import PronunciationEvaluator from './evaluation.js';
import SpeechManager from './speech.js';

export default class AccentMaster {
    constructor(language = 'fr-FR') {
        this.language = language;
        this.levels = ['easy', 'medium', 'hard'];
        this.wordBank = {};
        this.userProgress = null;
        this.evaluator = new PronunciationEvaluator(language);
        this.speech = new SpeechManager(language);
        this.init();
    }

    async init() {
        await this.loadWordBank();
        this.loadProgress();
        if (!this.userProgress) this.initializeNewUser();
    }

    async loadWordBank() {
        try {
            const langCode = this.language.split('-')[0];
            const module = await import(`../word-banks/${langCode}.js`);
            this.wordBank = module.default;
            this.prepareWordBank();
        } catch (error) {
            console.error('Ordlisteladdningsfel:', error);
            throw new Error('Kunde inte ladda ordlistan');
        }
    }

    prepareWordBank() {
        for (const level of this.levels) {
            if (this.wordBank[level]) {
                this.wordBank[level] = this.shuffleArray([...this.wordBank[level]]);
            }
        }
    }

    loadProgress() {
        const saved = localStorage.getItem(`accentMaster_${this.language}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.userProgress = {
                    currentLevel: data.currentLevel,
                    completedWords: new Set(data.completedWords),
                    failedAttempts: new Map(Object.entries(data.failedAttempts)),
                    activeWords: data.activeWords,
                    retiredWords: new Map(Object.entries(data.retiredWords)),
                    stars: data.stars
                };
            } catch (error) {
                console.error('Progressladdningsfel:', error);
            }
        }
    }

    saveProgress() {
        const data = {
            currentLevel: this.userProgress.currentLevel,
            completedWords: Array.from(this.userProgress.completedWords),
            failedAttempts: Object.fromEntries(this.userProgress.failedAttempts),
            activeWords: this.userProgress.activeWords,
            retiredWords: Object.fromEntries(this.userProgress.retiredWords),
            stars: this.userProgress.stars
        };
        localStorage.setItem(`accentMaster_${this.language}`, JSON.stringify(data));
    }

    initializeNewUser() {
        this.userProgress = {
            currentLevel: 'easy',
            completedWords: new Set(),
            failedAttempts: new Map(),
            activeWords: [...this.wordBank.easy],
            retiredWords: new Map(),
            stars: 0
        };
    }

    getNextWord() {
        this.checkRetiredWords();
        return this.userProgress.activeWords[0]?.word;
    }

    checkRetiredWords() {
        const now = Date.now();
        for (const [word, retireTime] of this.userProgress.retiredWords) {
            if (now > retireTime) {
                this.userProgress.activeWords.push(word);
                this.userProgress.retiredWords.delete(word);
            }
        }
    }

    handleSuccess(word) {
        this.userProgress.completedWords.add(word);
        this.userProgress.activeWords = this.userProgress.activeWords.filter(w => w.word !== word);
        this.userProgress.stars += this.calculateStars(word);
        
        if (this.userProgress.activeWords.length === 0) {
            this.levelUp();
        }
        this.saveProgress();
    }

    handleFailure(word) {
        const attempts = this.userProgress.failedAttempts.get(word) || 0;
        this.userProgress.failedAttempts.set(word, attempts + 1);

        if (attempts + 1 >= 5) {
            this.retireWord(word);
        }
        this.saveProgress();
    }

    retireWord(word) {
        this.userProgress.activeWords = this.userProgress.activeWords.filter(w => w.word !== word);
        this.userProgress.retiredWords.set(word, Date.now() + 600000); // 10 minuter
    }

    calculateStars(word) {
        const baseStars = this.levels.indexOf(this.userProgress.currentLevel) + 1;
        const fails = this.userProgress.failedAttempts.get(word) || 0;
        return Math.max(1, baseStars - Math.floor(fails / 2));
    }

    levelUp() {
        const currentIndex = this.levels.indexOf(this.userProgress.currentLevel);
        if (currentIndex < this.levels.length - 1) {
            this.userProgress.currentLevel = this.levels[currentIndex + 1];
            this.userProgress.activeWords = [...this.wordBank[this.userProgress.currentLevel]];
        }
    }

    getProgress() {
        const total = this.userProgress.activeWords.length + this.userProgress.completedWords.size;
        const completed = this.userProgress.completedWords.size;
        return {
            level: this.userProgress.currentLevel,
            completed: completed,
            total: total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    resetProgress() {
        localStorage.removeItem(`accentMaster_${this.language}`);
        this.userProgress = null;
        this.initializeNewUser();
        this.saveProgress();
        location.reload(); // Ladda om sidan
      }
}

class AccentMaster {
    constructor(lang) {
        this.lang = lang;
        this.levels = ['easy', 'medium', 'hard'];
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem(`accentMaster-${this.lang}`);
        if(saved) {
            const data = JSON.parse(saved);
            this.wordBank = data.wordBank;
            this.userProgress = data.userProgress;
            this.stars = data.stars;
        } else {
            this.initializeNewUser();
        }
    }

    initializeNewUser() {
        this.wordBank = {
            easy: this.shuffleArray([...frenchWords.easy]),
            medium: this.shuffleArray([...frenchWords.medium]),
            hard: this.shuffleArray([...frenchWords.hard])
        };
        
        this.userProgress = {
            currentLevel: 'easy',
            completedWords: [],
            failedAttempts: {},
            activeWords: [...this.wordBank.easy]
        };
        
        this.stars = 0;
        this.saveProgress();
    }

    saveProgress() {
        const data = {
            wordBank: this.wordBank,
            userProgress: this.userProgress,
            stars: this.stars
        };
        localStorage.setItem(`accentMaster-${this.lang}`, JSON.stringify(data));
    }

    getNextWord() {
        if(this.userProgress.activeWords.length === 0) {
            this.levelUp();
        }
        return this.userProgress.activeWords[0];
    }

    levelUp() {
        const currentLevelIndex = this.levels.indexOf(this.userProgress.currentLevel);
        if(currentLevelIndex < this.levels.length - 1) {
            this.userProgress.currentLevel = this.levels[currentLevelIndex + 1];
            this.userProgress.activeWords = [...this.wordBank[this.userProgress.currentLevel]];
        }
    }

    handleAttempt(word, success) {
        if(success) {
            this.stars += this.calculateStars(word);
            this.userProgress.completedWords.push(word);
            this.userProgress.activeWords.shift();
        } else {
            this.userProgress.failedAttempts[word] = 
                (this.userProgress.failedAttempts[word] || 0) + 1;
            
            if(this.userProgress.failedAttempts[word] >= 5) {
                this.retireWord(word);
            }
        }
        this.saveProgress();
    }

    retireWord(word) {
        this.userProgress.activeWords = this.userProgress.activeWords.filter(w => w !== word);
        setTimeout(() => {
            this.userProgress.activeWords.push(word);
        }, 600000); // Återinför efter 10 minuter
    }

    calculateStars(word) {
        const baseStars = this.levels.indexOf(this.userProgress.currentLevel) + 1;
        const fails = this.userProgress.failedAttempts[word] || 0;
        return Math.max(1, baseStars - Math.floor(fails/2));
    }

    shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }
}
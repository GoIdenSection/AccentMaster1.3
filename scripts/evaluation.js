class PronunciationEvaluator {
    constructor(lang = 'fr-FR') {
        this.lang = lang;
        this.weights = {
            vowelMatch: 0.4,
            consonantMatch: 0.3,
            stressPattern: 0.2,
            intonation: 0.1
        };
    }

    evaluate(original, attempt) {
        const cleanOriginal = this.normalizeText(original);
        const cleanAttempt = this.normalizeText(attempt);
        
        let score = 0;
        
        // Levenshtein distance-based accuracy
        score += 0.5 * this.levenshteinSimilarity(cleanOriginal, cleanAttempt);
        
        // Phonetic analysis
        score += 0.3 * this.phoneticSimilarity(cleanOriginal, cleanAttempt);
        
        // Length penalty
        score *= Math.pow(0.9, Math.abs(cleanOriginal.length - cleanAttempt.length));
        
        return Math.min(Math.max(Math.round(score * 100), 100), 0);
    }

    levenshteinSimilarity(a, b) {
        const matrix = [];
        for(let i = 0; i <= b.length; i++) matrix[i] = [i];
        for(let j = 0; j <= a.length; j++) matrix[0][j] = j;
        
        for(let i = 1; i <= b.length; i++){
            for(let j = 1; j <= a.length; j++){
                const cost = a[j-1] === b[i-1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i-1][j] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j-1] + cost
                );
            }
        }
        
        const distance = matrix[b.length][a.length];
        return 1 - distance / Math.max(a.length, b.length, 1);
    }

    phoneticSimilarity(original, attempt) {
        // Enkel fonetisk analys (utöka med språkspecifika regler)
        const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
        let score = 0;
        
        const oChars = original.split('');
        const aChars = attempt.split('');
        
        for(let i = 0; i < Math.min(oChars.length, aChars.length); i++){
            if(oChars[i] === aChars[i]) {
                score += vowels.has(oChars[i]) ? 
                    this.weights.vowelMatch : 
                    this.weights.consonantMatch;
            }
        }
        
        return score / Math.max(original.length, 1);
    }

    normalizeText(text) {
        return text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zåäöéèêàâûù]/gi, '');
    }
}
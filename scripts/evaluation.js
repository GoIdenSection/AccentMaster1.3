export default class PronunciationEvaluator {
    constructor(language = 'fr-FR') {
        this.language = language;
        this.setLanguageRules();
    }

    setLanguageRules() {
        this.rules = {
            'fr-FR': {
                vowels: new Set(['a', 'e', 'i', 'o', 'u', 'y', 'â', 'ê', 'î', 'ô', 'û']),
                vowelWeight: 0.6,
                consonantWeight: 0.4,
                phonemeMap: {
                    'au': 'o',
                    'eu': 'ø',
                    'ch': 'ʃ',
                    'gn': 'ɲ'
                }
            },
            'es-ES': {
                vowels: new Set(['a', 'e', 'i', 'o', 'u']),
                vowelWeight: 0.5,
                consonantWeight: 0.5,
                phonemeMap: {
                    'll': 'ʎ',
                    'ñ': 'ɲ',
                    'rr': 'r',
                    'ch': 'tʃ'
                }
            },
            'de-DE': {
                vowels: new Set(['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü']),
                vowelWeight: 0.55,
                consonantWeight: 0.45,
                phonemeMap: {
                    'sch': 'ʃ',
                    'ch': 'x',
                    'pf': 'p͡f'
                }
            },
            'it-IT': {
                vowels: new Set(['a', 'e', 'i', 'o', 'u']),
                vowelWeight: 0.65,
                consonantWeight: 0.35,
                phonemeMap: {
                    'gn': 'ɲ',
                    'gl': 'ʎ',
                    'sc': 'ʃ'
                }
            },
            'en-US': {
                vowels: new Set(['a', 'e', 'i', 'o', 'u']),
                vowelWeight: 0.5,
                consonantWeight: 0.5,
                phonemeMap: {
                    'th': 'θ',
                    'sh': 'ʃ',
                    'ng': 'ŋ'
                }
            }
        };
    }

    evaluate(original, attempt) {
        const cleanOriginal = this.normalize(original);
        const cleanAttempt = this.normalize(attempt);
        
        let score = 0;
        
        // Levenshtein-based similarity
        score += 0.4 * this.levenshteinSimilarity(cleanOriginal, cleanAttempt);
        
        // Phonetic analysis
        score += 0.4 * this.phoneticAnalysis(cleanOriginal, cleanAttempt);
        
        // Length similarity
        score += 0.2 * (1 - Math.abs(cleanOriginal.length - cleanAttempt.length) / Math.max(cleanOriginal.length, 1));
        
        return Math.min(Math.round(score * 100), 100);
    }

    levenshteinSimilarity(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j-1] === b[i-1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i-1][j] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j-1] + cost
                );
            }
        }

        const distance = matrix[b.length][a.length];
        return 1 - (distance / Math.max(a.length, b.length, 1));
    }

    phoneticAnalysis(original, attempt) {
        const langRules = this.rules[this.language];
        let score = 0;
        
        const oPhonemes = this.getPhonemes(original, langRules);
        const aPhonemes = this.getPhonemes(attempt, langRules);

        for (let i = 0; i < Math.min(oPhonemes.length, aPhonemes.length); i++) {
            if (oPhonemes[i] === aPhonemes[i]) {
                score += langRules.vowels.has(oPhonemes[i]) 
                    ? langRules.vowelWeight 
                    : langRules.consonantWeight;
            }
        }
        
        return score / Math.max(oPhonemes.length, 1);
    }

    getPhonemes(text, rules) {
        let phonemes = [];
        let index = 0;
        
        while (index < text.length) {
            let found = false;
            
            // Check multi-character phonemes first
            for (const [seq, phoneme] of Object.entries(rules.phonemeMap)) {
                if (text.startsWith(seq, index)) {
                    phonemes.push(phoneme);
                    index += seq.length;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                phonemes.push(text[index]);
                index++;
            }
        }
        
        return phonemes;
    }

    normalize(text) {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z]/gi, '');
    }
}



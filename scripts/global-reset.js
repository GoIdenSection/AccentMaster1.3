// scripts/global-reset.js
function resetAllProgress() {
    if (confirm("Vill du verkligen radera ALL framsteg i ALLA språk?")) {
        // Rensa alla språkspecifika entries
        const langCodes = ['fr-FR', 'de-DE', 'es-ES', 'it-IT', 'en-US'];
        langCodes.forEach(lang => {
            localStorage.removeItem(`accentMaster_${lang}`);
        });
        
        // Rensa generell progress
        localStorage.removeItem('accentMaster_global');
        alert("All progress har raderats!");
        location.reload();
    }
}

// Exponera funktionen globalt
window.resetAllProgress = resetAllProgress;
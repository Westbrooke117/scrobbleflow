const saveToLocalStorage = (optionSetting) => {
    localStorage.setItem(optionSetting.name, optionSetting.value);
}

const getLocalStorageItems = () => {
    return { ...localStorage }
}

// Reads a setting saved with saveToLocalStorage, falling back if it's missing, unreadable or of the wrong type
const getStoredSetting = (name, fallback) => {
    try {
        const value = JSON.parse(localStorage.getItem(name));
        return value !== null && typeof value === typeof fallback ? value : fallback;
    } catch {
        return fallback;
    }
}

export { saveToLocalStorage, getLocalStorageItems, getStoredSetting }
const saveToLocalStorage = (optionSetting) => {
    localStorage.setItem(optionSetting.name, optionSetting.value);
}

const getLocalStorageItems = () => {
    return { ...localStorage }
}

export { saveToLocalStorage, getLocalStorageItems }
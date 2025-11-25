let gameLocked = false;

export function isGameLocked() {
    return gameLocked;
}

export function lockGame() {
    gameLocked = true;
}

export function unlockGame() {
    gameLocked = false;
}
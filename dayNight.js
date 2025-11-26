let dayNightProgress = 0;

function setDayNightProgress(value) {
    dayNightProgress = Math.max(0, Math.min(1, value));
}
 function getDayNightProgress() {
    return dayNightProgress;
}
export { setDayNightProgress, getDayNightProgress };
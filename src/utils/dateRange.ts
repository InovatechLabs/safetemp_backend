export function getDayRange(date: Date) {
    const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
    );

    const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1,
        0, 0, 0, 0
    );

    return { startOfDay, endOfDay };
}

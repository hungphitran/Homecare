// Utility functions for handling Vietnamese timezone
const vietnamTimezone = 'Asia/Ho_Chi_Minh';

function createVietnamDateTime(dateString, timeString) {
    // Create date object in Vietnam timezone
    const dateTime = new Date(`${dateString}T${timeString}:00`);
    
    // Adjust for Vietnam timezone (UTC+7)
    const vietnamDate = new Date(dateTime.getTime() + (7 * 60 * 60 * 1000));
    
    return vietnamDate;
}

function formatDateTimeForAPI(dateString, timeString, format = 'iso') {
    const dateTime = new Date(`${dateString}T${timeString}:00`);
    
    switch (format) {
        case 'local':
            return `${dateString}T${timeString}:00`;
        case 'vietnam':
            // Add Vietnam timezone offset
            const vietnamTime = new Date(dateTime.getTime() + (7 * 60 * 60 * 1000));
            return vietnamTime.toISOString();
        case 'timestamp':
            return dateTime.getTime();
        case 'iso':
        default:
            return dateTime.toISOString();
    }
}

module.exports = {
    createVietnamDateTime,
    formatDateTimeForAPI,
    vietnamTimezone
};

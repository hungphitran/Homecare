// Time Picker Logic for Homecare Application
// This file contains the common logic for time selection across all pages

class TimePickerLogic {
    constructor() {
        this.currentDateTime = this.getCurrentDateTime();
    }

    // Get current time and date
    getCurrentDateTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDate = now.toISOString().split('T')[0];
        
        return {
            hour: currentHour + (currentMinute / 60),
            date: currentDate,
            isAfter15h: currentHour >= 15
        };
    }

    // Generate time options with 30-minute intervals
    generateTimeOptions(startHour, endHour) {
        const times = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : hour;

            // Add :00 option
            times.push({
                display: `${displayHour}:00 ${period}`,
                value: `${hour.toString().padStart(2, '0')}:00`,
                hour: hour
            });

            // Add :30 option if not the last hour
            if (hour < endHour) {
                times.push({
                    display: `${displayHour}:30 ${period}`,
                    value: `${hour.toString().padStart(2, '0')}:30`,
                    hour: hour + 0.5
                });
            }
        }
        return times;
    }

    // Generate start time options based on current time and selected date
    generateStartTimeOptions(selectedDate) {
        const current = this.getCurrentDateTime();
        const isToday = selectedDate === current.date;
        
        let minStartHour = 6; // Minimum start time is 6 AM
        
        if (isToday) {
            // If today, start time must be at least 2 hours after current time
            minStartHour = Math.max(6, Math.ceil(current.hour + 2));
            
            // If current time is after 15h (3 PM), no valid start times for today
            if (current.isAfter15h) {
                return [];
            }
        }
        
        // Maximum start time is 18h (6 PM) to ensure at least 2 hours before 20h
        const maxStartHour = 18;
        
        if (minStartHour > maxStartHour) {
            return [];
        }
        
        return this.generateTimeOptions(minStartHour, maxStartHour);
    }

    // Generate end time options based on start time
    generateEndTimeOptions(startHour) {
        const minEndHour = startHour + 2; // At least 2 hours after start time
        const maxEndHour = 20; // Maximum end time is 20h (8 PM)
        
        if (minEndHour > maxEndHour) {
            return [];
        }
        
        return this.generateTimeOptions(minEndHour, maxEndHour);
    }

    // Check if date should be automatically set to tomorrow
    shouldSetToTomorrow(selectedDate) {
        const current = this.getCurrentDateTime();
        return current.isAfter15h && selectedDate === current.date;
    }

    // Get tomorrow's date
    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // Validate time selection
    validateTimeSelection(startTime, endTime) {
        if (!startTime || !endTime) {
            return { valid: false, message: 'Vui lòng chọn cả thời gian bắt đầu và kết thúc' };
        }

        const startHour = parseFloat(startTime.dataset.hour);
        const endHour = parseFloat(endTime.dataset.hour);

        if (endHour <= startHour) {
            return { valid: false, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' };
        }

        if (endHour - startHour < 2) {
            return { valid: false, message: 'Thời gian kết thúc phải sau thời gian bắt đầu ít nhất 2 giờ' };
        }

        return { valid: true, message: '' };
    }

    // Update date input if current time is after 15h
    updateDateIfNeeded(dateInput) {
        if (this.shouldSetToTomorrow(dateInput.value)) {
            dateInput.value = this.getTomorrowDate();
            return true; // Date was updated
        }
        return false; // Date was not updated
    }

    // Initialize time picker with proper validation
    initializeTimePicker(startTimeList, endTimeList, startTimes, endTimes, endTimeInput) {
        // Populate start time list
        this.populateTimeList(startTimeList, startTimes);
        
        // Reset end time picker
        endTimeInput.style.opacity = '0.5';
        endTimeInput.style.pointerEvents = 'none';
        this.populateTimeList(endTimeList, []);
    }

    // Populate time list with options
    populateTimeList(timeList, times) {
        timeList.innerHTML = '';
        times.forEach(time => {
            const option = document.createElement('div');
            option.className = 'time-option-homecare';
            option.textContent = time.display;
            option.dataset.value = time.value;
            option.dataset.hour = time.hour;
            timeList.appendChild(option);
        });
    }

    // Update end time options when start time changes
    updateEndTimeOptions(endTimeList, startHour, endTimeInput, handleTimeSelection) {
        const endTimes = this.generateEndTimeOptions(startHour);
        this.populateTimeList(endTimeList, endTimes);

        // Auto-select the time that's 2 hours after start time if available
        const twoHoursLater = startHour + 2;
        const autoSelectTime = endTimes.find(time => time.hour >= twoHoursLater);
        if (autoSelectTime) {
            const endTimeOption = endTimeList.querySelector(`[data-value="${autoSelectTime.value}"]`);
            if (endTimeOption && handleTimeSelection) {
                handleTimeSelection(endTimeInput, endTimeOption);
            }
        }

        return endTimes;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimePickerLogic;
} else {
    // Browser environment
    window.TimePickerLogic = TimePickerLogic;
}

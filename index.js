import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

const calendarInput = document.querySelector('#calendar');
const calendarBtn = document.querySelector('#calendar-btn');

// let selectedDates = [];

// Save a calendar instance to a variable
const calendarInstance = flatpickr(calendarInput, {
  mode: 'range',
  dateFormat: 'd M Y',
  //   onChange: (dates) => {
  //     selectedDates = dates.map((date) => date.toISOString().split('T')[0]);
  //   },
  clickOpens: false,
});

// Open the calendar when the button is clicked
calendarBtn.addEventListener('click', () => {
  calendarInstance.open();
});

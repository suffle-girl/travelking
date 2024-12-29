import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

const calendarBtn = document.querySelector('#calendar-btn');

flatpickr(calendarBtn, {
  mode: 'range',
  dateFormat: 'd M Y',
});

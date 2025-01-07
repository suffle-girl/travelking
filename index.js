import flatpickr from 'flatpickr';

const calendarInput = document.querySelector('#calendar');
const calendarBtn = document.querySelector('#calendar-btn');
const calendarModal = document.querySelector('#calendar-modal');
const closeModalBtn = document.querySelector('#btn-close-modal');
const availabilityBtn = document.querySelector('#btn-availability');
const availabilityMsg = document.querySelector('#availability-msg');

let datePrices = {};
let selectedDates = [];

// Fetching function
const fetchData = async () => {
  try {
    const response = await fetch(
      'https://api.travelcircus.net/hotels/17080/checkins?E&party=%7B%22adults%22:2,%22children%22:%5B%5D%7D&domain=de&date_start=2025-01-01&date_end=2025-06-31'
    );

    if (response.ok) {
      const data = await response.json();
      const availabilities = data._embedded.hotel_availabilities;
      console.log(availabilities);

      // Map of prices of each date available
      datePrices = availabilities.reduce((acc, availability) => {
        const date = availability.date;
        const price = availability.price;
        acc[date] = price;
        return acc;
      }, {});

      console.log('date prices', datePrices);
      return datePrices;
    } else {
      throw new Error('Failed to fetch date prices data');
    }
  } catch (error) {
    console.error('Error fetching date prices:', error);
  }
};

// Initialize flatpickr
const calendarInstance = flatpickr(calendarInput, {
  mode: 'range',
  inline: true, // Embed the calendar
  minDate: 'today',
  maxDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
  dateFormat: 'd M Y',
  clickOpens: false,

  // Hook to customize the content of each day
  onDayCreate: function (dObj, dStr, fp, dayElem) {
    // Format the date using flatpickr.formatDate to ensure correct local date
    const date = flatpickr.formatDate(dayElem.dateObj, 'Y-m-d'); // Outputs YYYY-MM-DD
    const price = datePrices[date]; // Get the price for that day

    // If there is a price, display it in the calendar
    if (price) {
      const priceElement = document.createElement('div');
      priceElement.classList.add('flatpickr-price');
      priceElement.innerText = `€${price}`;
      dayElem.appendChild(priceElement);
    }
  },

  // Save the chosen dates into global variables
  onChange: (dates, dateStr) => {
    selectedDates = dates.map(
      (date) => flatpickr.formatDate(date, 'Y-m-d') // Outputs YYYY-MM-DD
    );

    console.log('selected dates:', selectedDates);
  },
});

// Show the modal when the button is clicked
calendarBtn.addEventListener('click', () => {
  calendarModal.style.display = 'flex'; // Show the modal
});

// Close the modal
closeModalBtn.addEventListener('click', () => {
  calendarModal.style.display = 'none';
});

// Close the modal when clicking outside the modal content
window.addEventListener('click', (event) => {
  if (event.target === calendarModal) {
    calendarModal.style.display = 'none';
  }
});

// Check available rooms
availabilityBtn.addEventListener('click', () => {
  const checkinDate = selectedDates[0];
  const checkoutDate = selectedDates[1];

  // Validate that valid check-in and checkout dates are selected
  if (checkinDate === checkoutDate) {
    return (availabilityMsg.innerHTML =
      'Check-in and check-out dates cannot be the same.<br/>Please select valid dates.');
  }

  // Generate the range of dates between check-in and the day before check-out
  const rangeDates = [];
  let currentDate = new Date(checkinDate);

  while (currentDate < new Date(checkoutDate)) {
    const formattedDate = flatpickr.formatDate(currentDate, 'Y-m-d');
    rangeDates.push(formattedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Check for invalid dates in the range (excluding checkout)
  const invalidDates = rangeDates.filter((date) => !datePrices[date]);

  if (invalidDates.length > 0) {
    console.log('Invalid dates in range:', invalidDates);
    return (availabilityMsg.innerHTML =
      'Some dates in your selected range are not available for booking.<br/>Please adjust your selection.');
  }

  const apiEndpoint = `https://api.travelcircus.net/hotels/17080/quotes?locale=de_DE&checkin=${checkinDate}&checkout=${checkoutDate}&party=%7B%22adults%22:2,%22children%22:[]%7D&domain=de`;

  const fetchAvailabilityData = async () => {
    try {
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        const availableRooms = data._embedded.hotel_quotes;

        availabilityMsg.innerHTML = `There are ${availableRooms.length} room(s) available.`;
      } else {
        throw new Error('Failed to fetch availability data.');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  fetchAvailabilityData();
});

// Fetch data
fetchData();

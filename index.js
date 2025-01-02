import flatpickr from 'flatpickr';

const calendarInput = document.querySelector('#calendar');
const calendarBtn = document.querySelector('#calendar-btn');

let datePrices = {};

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

      console.log(datePrices);
      return datePrices;
    } else {
      throw new Error('Failed to fetch availability data');
    }
  } catch (error) {
    console.error('Error fetching availability:', error);
  }
};

const calendarInstance = flatpickr(calendarInput, {
  mode: 'range',
  minDate: 'today',
  maxDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
  dateFormat: 'd M Y',
  clickOpens: false,

  // Hook to customize the content of each day
  onDayCreate: function (dObj, dStr, fp, dayElem) {
    const date = dayElem.dateObj.toISOString().split('T')[0]; // Convert date to YYYY-MM-DD format
    const price = datePrices[date]; // Get the price for that day

    // If there is a price, display it in the calendar
    if (price) {
      const priceElement = document.createElement('div');
      priceElement.classList.add('flatpickr-price');
      priceElement.innerText = `€${price}`;
      dayElem.appendChild(priceElement);
    }
  },
});

// Open the calendar when the button is clicked
calendarBtn.addEventListener('click', () => {
  calendarInstance.open();
});

// Fetch data
fetchData();

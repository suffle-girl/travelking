import flatpickr from 'flatpickr';

const calendarInput = document.querySelector('#calendar-input');
const calendarBtn = document.querySelector('#calendar-btn');
const calendarModal = document.querySelector('#calendar-modal');
const closeModalBtn = document.querySelector('#btn-close-modal');
const availabilityBtn = document.querySelector('#btn-availability');
const availabilityMsg = document.querySelector('#availability-msg');

let datePrices = {};
let cheapPrices = {};
let selectedDates = [];

// Fetch calendar data
const fetchData = async () => {
  try {
    const response = await fetch(
      'https://api.travelcircus.net/hotels/17080/checkins?E&party=%7B%22adults%22:2,%22children%22:%5B%5D%7D&domain=de&date_start=2025-01-01&date_end=2025-06-31'
    );

    if (response.ok) {
      const data = await response.json();
      const availabilities = data._embedded.hotel_availabilities;
      console.log(availabilities);

      // Map prices of each date available
      datePrices = availabilities.reduce((acc, availability) => {
        const date = availability.date;
        const price = availability.price;
        acc[date] = price;
        return acc;
      }, {});

      // Map cheapest options
      cheapPrices = availabilities.reduce((item, availability) => {
        const date = availability.date;
        const cheapest = availability.cheapest;
        item[date] = cheapest;
        return item;
      }, {});

      return datePrices, cheapPrices;
    } else {
      throw new Error('Failed to fetch date prices data');
    }
  } catch (error) {
    console.error('Error fetching date prices:', error);
  }
};

// Initialize flatpickr
const initializeCalendar = () => {
  const calendarInstance = flatpickr(calendarInput, {
    mode: 'range',
    inline: true, // Embed the calendar
    minDate: 'today',
    maxDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    dateFormat: 'd M Y',
    clickOpens: false,
    locale: {
      firstDayOfWeek: 1, // Start week on Monday
    },

    // Hook to customize the content of each day
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      // Format the date using flatpickr.formatDate to ensure correct local date
      const date = flatpickr.formatDate(dayElem.dateObj, 'Y-m-d');
      const price = datePrices[date]; // Get the price for that day

      // If there is a price, display it in the calendar
      if (price) {
        const priceElement = document.createElement('div');
        priceElement.classList.add('flatpickr-price');

        // Add cheapest class to the cheapest prices
        if (datePrices[date] && cheapPrices[date]) {
          priceElement.classList.add('flatpickr-price__cheapest');
        }

        priceElement.innerText = `€${price}`;
        dayElem.appendChild(priceElement);
      }
    },

    // Save selected dates into global variables
    onChange: (dates, dateStr) => {
      selectedDates = dates.map(
        (date) => flatpickr.formatDate(date, 'Y-m-d') // Outputs YYYY-MM-DD
      );

      // Format dates for display
      const formattedDates = dates.map((date) =>
        flatpickr.formatDate(date, 'd M Y')
      );

      // Display selected dates
      const selectedDatesParagraph = document.querySelector('.selected-dates');
      if (formattedDates.length === 1) {
        selectedDatesParagraph.innerHTML = `<b>Selected dates</b>: ${formattedDates[0]}`;
      } else {
        selectedDatesParagraph.innerHTML = `<b>Selected dates</b>: ${formattedDates[0]} to ${formattedDates[1]}`;
      }

      console.log('selected dates:', selectedDates);
    },
  });
};

// Fetch room availability data
const fetchAvailabilityData = async () => {
  const checkinDate = selectedDates[0];
  const checkoutDate = selectedDates[1];

  // Validate that valid check-in and checkout dates are selected
  if (checkinDate === checkoutDate) {
    return (availabilityMsg.innerHTML =
      'Check-in and check-out dates cannot be the same.<br/>Please select valid dates.');
  }

  // Calculate the number of nights
  const checkin = new Date(checkinDate);
  const checkout = new Date(checkoutDate);
  const numberOfNights = (checkout - checkin) / (1000 * 60 * 60 * 24); // Difference in days

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

  try {
    const response = await fetch(apiEndpoint);
    if (response.ok) {
      const data = await response.json();
      const availableRooms = data._embedded.hotel_quotes;

      console.log('availableRooms:', availableRooms);

      // Prep availability message for the new content
      availabilityMsg.innerHTML = '';

      const heading = document.createElement('h3');
      heading.textContent = `There are ${availableRooms.length} room(s) available:`;
      availabilityMsg.appendChild(heading);

      const roomsContainer = document.createElement('div');
      roomsContainer.classList.add('rooms-container');
      availabilityMsg.appendChild(roomsContainer);

      // Loop through the rooms and create dynamically HTML elements
      availableRooms.forEach((room) => {
        // Create a container
        const roomContainer = document.createElement('div');
        roomContainer.classList.add('room-container');

        // Add room name
        const roomName = document.createElement('h4');
        roomName.textContent = room.name;
        roomContainer.appendChild(roomName);

        // Add room price for the whole stay
        const roomPrice = document.createElement('p');
        roomPrice.innerHTML = `Full price: <b>${room.full_price} ${room.currency}</b> <i>(${numberOfNights} nights)</i>`;
        roomContainer.appendChild(roomPrice);

        // Add room capacity
        const roomCapacity = document.createElement('p');
        roomCapacity.innerHTML = `Base capacity: ${room.base_capacity} <br/> Max capacity: ${room.max_capacity}`;
        roomContainer.appendChild(roomCapacity);

        // Append the room container to the main rooms container
        roomsContainer.appendChild(roomContainer);
      });
    } else {
      throw new Error('Failed to fetch availability data.');
    }
  } catch (error) {
    console.error('Error fetching availability:', error);
  }
};

// Show the modal when the button is clicked
calendarBtn.addEventListener('click', () => {
  calendarModal.style.display = 'flex';
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
  fetchAvailabilityData();
});

// Fetch prices and initialize the calendar
(async () => {
  await fetchData(); // Ensure datePrices is populated
  initializeCalendar(); // Initialize the calendar with fetched data
})();

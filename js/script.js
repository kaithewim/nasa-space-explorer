// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const modalCloseButton = document.getElementById('modalCloseButton');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const spaceFactText = document.getElementById('spaceFactText');
const maxImageAmount = 100;

let galleryItems = [];

const spaceFacts = [
	'One day on Venus is longer than one year on Venus.',
	'Neutron stars can spin more than 600 times each second.',
	'The footprints from Apollo astronauts can last for millions of years on the Moon.',
	'Jupiter has the shortest day in our solar system: about 10 hours.',
	'The Hubble Space Telescope travels around Earth at roughly 17,000 miles per hour.',
	'The International Space Station circles Earth about every 90 minutes.'
];

// Personal API key provided for this project
const apiKey = 'mf5oueUUgvho9boyjezmvV3sLPm7hxFk2TRClHEN';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

let userSelectedEndDate = endInput.value;

function handleStartDateChange() {
	// Always keep end-date choices on or after the selected start date.
	endInput.min = startInput.value;

	// dateRange.js auto-updates the end date; restore the user's chosen end date when valid.
	if (userSelectedEndDate >= startInput.value) {
		endInput.value = userSelectedEndDate;
	} else {
		endInput.value = startInput.value;
		userSelectedEndDate = endInput.value;
	}
}

function handleEndDateChange() {
	endInput.min = startInput.value;

	if (endInput.value < startInput.value) {
		endInput.value = startInput.value;
	}

	userSelectedEndDate = endInput.value;
}

handleEndDateChange();
startInput.addEventListener('change', handleStartDateChange);
endInput.addEventListener('change', handleEndDateChange);

function showRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

function getSelectedDayCount(startDate, endDate) {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const dayMs = 24 * 60 * 60 * 1000;

	// Include both start and end dates in the total.
	return Math.floor((end - start) / dayMs) + 1;
}

// Request APOD data from NASA and return only the fields we need.
async function getApodData(startDate, endDate) {
	const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error('NASA API request failed. Please try again.');
	}

	const data = await response.json();

	// Keep only image entries and return a clean object shape for the gallery.
	return data
		.filter((item) => item.media_type === 'image')
		.slice(0, maxImageAmount)
		.map((item) => ({
			imageUrl: item.url,
			title: item.title,
			date: item.date,
			explanation: item.explanation
		}));
}

function renderGallery(items) {
	galleryItems = items;

	if (items.length === 0) {
		gallery.innerHTML = `
			<div class="placeholder">
				<div class="placeholder-icon">🛰️</div>
				<p>No images were found for this range. Try different dates.</p>
			</div>
		`;
		return;
	}

	gallery.innerHTML = items
		.map((item, index) => `
			<article class="gallery-item" data-index="${index}">
				<img src="${item.imageUrl}" alt="${item.title}" />
				<p><strong>${item.title}</strong> (${item.date})</p>
			</article>
		`)
		.join('');
}

function openModal(item) {
	modalImage.src = item.imageUrl;
	modalImage.alt = item.title;
	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;

	imageModal.classList.add('open');
	imageModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
	imageModal.classList.remove('open');
	imageModal.setAttribute('aria-hidden', 'true');
	modalImage.src = '';
}

function showLoadingState() {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔄</div>
			<p>Loading space photos...</p>
		</div>
	`;
}

function showErrorState(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">⚠️</div>
			<p>${message}</p>
		</div>
	`;
}

async function loadGallery() {
	closeModal();

	if (getSelectedDayCount(startInput.value, endInput.value) > maxImageAmount) {
		showErrorState('Please choose a date range of 100 days or fewer.');
		return;
	}

	showLoadingState();

	try {
		const items = await getApodData(startInput.value, endInput.value);
		renderGallery(items);
	} catch (error) {
		showErrorState(error.message);
	}
}

// Load data when the user clicks the button.
getImagesButton.addEventListener('click', loadGallery);

// Open the modal when a gallery card is clicked.
gallery.addEventListener('click', (event) => {
	const clickedCard = event.target.closest('.gallery-item');

	if (!clickedCard) {
		return;
	}

	const index = Number(clickedCard.dataset.index);
	const selectedItem = galleryItems[index];

	if (selectedItem) {
		openModal(selectedItem);
	}
});

// Close button inside the modal.
modalCloseButton.addEventListener('click', closeModal);

// Clicking the dark overlay closes the modal too.
imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeModal();
	}
});

// Escape key support for keyboard users.
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && imageModal.classList.contains('open')) {
		closeModal();
	}
});

// Show a new random fact each time the page is refreshed.
showRandomSpaceFact();

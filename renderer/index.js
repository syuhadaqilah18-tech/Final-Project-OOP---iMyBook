//get references to the html elements (dom)
const searchInput = document.getElementById('searchInput');
const searchType = document.getElementById('searchType');
const searchBtn = document.getElementById('searchBtn');
const message = document.getElementById('message');
const output = document.getElementById('output');
const detailsBox = document.getElementById('detailsBox');

//API 1 + 2: search books by title OR author
async function searchBooks(query, type){
    //clear old results and show a loading message
    output.innerHTML = '';
    message.textContent = 'Loading...';

    try{
        //type is either "title" or "author", which are Open Library search options
        const response = await fetch(
            `https://openlibrary.org/search.json?${type}=${encodeURIComponent(query)}&limit=12`
        );

        //if server replied with an error, treat it as a failure
        if(!response.ok){
            throw new Error('Server error: ' + response.status);
        }

        const data = await response.json();

        //error scenario: search worked but found nothing
        if(data.docs.length === 0){
            message.textContent = 'No books found. Try another search.';
            return;
        }
        message.textContent = `Found ${data.docs.length} books.`;
        displayBooks(data.docs);
    } catch (error) {
        //error scenario: failed request (no internet, server down)
        message.textContent = 'Could not load books. Check your connection and try again.';
        console.log(error);
    }
}

//API 4: get the details (description, subjects) of one book
async function showDetails(book){
    detailsBox.classList.remove('hidden');
    detailsBox.textContent = 'Loading details...';

    try{
        //book.key looks like "/works/OL45804W"
        const response = await fetch(`https://openlibrary.org${book.key}.json`);
        if(!response.ok){
            throw new Error('Server error: ' + response.status);
        }
        const data = await response.json();

        //the description can be plain text, an object with a "value", or missing
        let description = 'No description available for this book.';
        if (typeof data.description === 'string'){
            description = data.description;
        } else if (data.description && data.description.value){
            description = data.description.value;
        }
        //keep it short so the box stays readable
        if (description.length > 600){
            description = description.slice(0, 600) + '...';
        }

        const subjects = data.subjects && data.subjects.length > 0
            ? data.subjects.slice(0, 6).join(', ')
            : 'No subjects listed';

        //build the box with textContent so the text can't break the page
        detailsBox.innerHTML = '';
        const heading = document.createElement('h3');
        heading.textContent = data.title || book.title;
        const desc = document.createElement('p');
        desc.textContent = description;
        const subj = document.createElement('p');
        subj.textContent = 'Subjects: ' + subjects;
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', function(){
            detailsBox.classList.add('hidden');
        });
        detailsBox.appendChild(heading);
        detailsBox.appendChild(desc);
        detailsBox.appendChild(subj);
        detailsBox.appendChild(closeBtn);
        detailsBox.scrollIntoView();
    } catch (error){
        detailsBox.textContent = 'Could not load details. Please try again.';
        console.log(error);
    }
}

//helper: make a "Details" button for a book (only if it has a key)
function makeDetailsButton(book){
    const btn = document.createElement('button');
    btn.textContent = 'Details';
    btn.addEventListener('click', function(){
        showDetails(book);
    });
    return btn;
}

//build one card for each book
function displayBooks(books){
    books.forEach(function(book){
        //some books are missing data, so each field has a fallback
        const title = book.title || 'Unknown title';
        const author = book.author_name ? book.author_name[0] : 'Unknown author';
        const year = book.first_publish_year || 'N/A';
        const pages = book.number_of_pages_median || 'N/A';

        //API 5: cover image, built from the cover ID
        const coverUrl = book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : '';

        //create the card element and fill it with the book's info
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            ${coverUrl ? `<img src="${coverUrl}" alt="Cover of ${title}">` : '<p>No cover</p>'}
            <h3>${title}</h3>
            <p>Author: ${author}</p>
            <p>First published: ${year}</p>
            <p>Pages: ${pages}</p>
        `;

        //details button (only when the book has a key)
        if (book.key) card.appendChild(makeDetailsButton(book));

        //add the card to the page
        output.appendChild(card);
    });
}

//API 3: get a list of books for one genre, with page count and rating
async function getBooksByGenre(genre){
    const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(genre)}` +
        `&limit=50&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,ratings_average`;

    const response = await fetch(url);
    if (!response.ok){
        throw new Error('Server error: ' + response.status);
    }
    const data = await response.json();
    return data.docs; //array of book objects
}

const genreSelect = document.getElementById('genreSelect');
const lengthSelect = document.getElementById('lengthSelect');
const ratingSelect = document.getElementById('ratingSelect');
const suggestBtn = document.getElementById('suggestBtn');
const suggestion = document.getElementById('suggestion');

//decide which books match the user's choices
function pickBooks(books, length, rating){
    //set page range from length choice
    let minPages, maxPages;
    switch (length){
        case 'short':
            minPages = 1;
            maxPages = 249;
            break;
        case 'medium':
            minPages = 250;
            maxPages = 500;
            break;
        case 'long':
            minPages = 501;
            maxPages = Infinity; //no upper limit
            break;
        default:
            //unexpected value: accept any length
            minPages = 1;
            maxPages = Infinity;
    }

    //set minimum rating
    let minRating;
    if (rating === 'great'){
        minRating = 4.0;
    } else if (rating === 'good'){
        minRating = 3.5;
    } else {
        minRating = 0; //no minimum for "any"
    }

    //keep only books that match both conditions
    const matches = [];
    books.forEach(function (book){
        const pages = book.number_of_pages_median;
        const score = book.ratings_average;

        //skip book with no page count (can't check length)
        if (!pages) return;

        //skip book with no rating when the user wants a minimum rating
        if (rating !== 'any' && !score) return;

        //check page range
        const pagesOk = pages >= minPages && pages <= maxPages;

        //check rating. with "any", every book passes
        const ratingOk = rating === 'any' || score >= minRating;

        //keep the book only if both conditions are true
        if (pagesOk && ratingOk){
            matches.push(book);
        }
    });
    return matches;
}

const totalPagesInput = document.getElementById('totalPages');
const pagesReadInput = document.getElementById('pagesRead');
const pagesPerDayInput = document.getElementById('pagesPerDay');
const calcBtn = document.getElementById('calcBtn');
const calcResult = document.getElementById('calcResult');

//calculate how long it takes to finish a book
function calculateReading(total, read, perDay){
    const remaining = total - read; //pages yet to read
    const days = Math.ceil(remaining / perDay); //round up (part of a day still counts as a day)
    const percent = (read / total) * 100; //how much is already done in %

    //finish date = today + the number of days needed
    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + days);

    //send all results back so the click event can display them
    return { remaining, days, percent, finishDate };
}

calcBtn.addEventListener('click', function () {
    //convert text from input boxes into numbers
    const total = Number(totalPagesInput.value);
    const read = Number(pagesReadInput.value);
    const perDay = Number(pagesPerDayInput.value);

    //validation: check every case that could break the calculation
    if (!total || total <= 0){
        calcResult.textContent = 'Please enter the total pages (more than 0).';
        return;
    }
    if (read < 0){
        calcResult.textContent = 'Pages read cannot be negative.';
        return;
    }
    if (read > total){
        calcResult.textContent = 'Pages read cannot be more than the total pages.';
        return;
    }
    if (read === total){
        calcResult.textContent = 'You have already finished this book!';
        return;
    }
    if (!perDay || perDay <= 0){
        calcResult.textContent = 'Please enter pages per day (more than 0).';
        return;
    }

    //all inputs are valid, so run the calculation
    const result = calculateReading(total, read, perDay);

    //show results with clear labels and units
    calcResult.innerHTML = `
        <p>Pages remaining: <strong>${result.remaining} pages</strong></p>
        <p>Progress so far: <strong>${result.percent.toFixed(1)}%</strong></p>
        <p>Time to finish: <strong>${result.days} day(s)</strong></p>
        <p>Estimated finish date: <strong>${result.finishDate.toLocaleDateString('en-GB')}</strong></p>
    `;
});

//event: runs when the user clicks the search button
searchBtn.addEventListener('click', function(){
    const query = searchInput.value.trim();

    //error scenario: invalid input (empty search box)
    if (query === ''){
        message.textContent = 'Please type something to search.';
        return;
    }
    searchBooks(query, searchType.value);
});

//event: let the user press Enter instead of clicking
searchInput.addEventListener('keydown', function(event){
    if (event.key === 'Enter'){
        searchBtn.click();
    }
});

//event: runs when the user clicks "Suggest Books"
suggestBtn.addEventListener('click', async function (){
    //clear any old message from the search section
    message.textContent = '';

    //read the user's choices from the dropdowns
    const genre = genreSelect.value;
    const length = lengthSelect.value;
    const rating = ratingSelect.value;

    suggestion.textContent = 'Finding books for you...';

    try{
        //get books for the genre, then filter them with our logic
        const books = await getBooksByGenre(genre);
        const matches = pickBooks(books, length, rating);

        //fallback: nothing matched the user's choices
        if (matches.length === 0){
            suggestion.textContent =
                'No suitable book found. Try a different length or rating.';
            return;
        }

        //shuffle the matches, then keep up to 5 of them
        const shuffled = matches.sort(function () { return Math.random() - 0.5; });
        const picks = shuffled.slice(0, 5);

        //store these suggestions in Local Storage (required by the assignment)
        saveSuggestions(picks.map(function (b) {
            return {
                title: b.title,
                author: b.author_name ? b.author_name[0] : 'Unknown author',
                pages: b.number_of_pages_median,
                rating: b.ratings_average ? b.ratings_average.toFixed(1) : 'Not rated'
            };
        }));

        //clear the "Finding books..." text, then build one card per pick
        suggestion.innerHTML = '';
        picks.forEach(function (book) {
            const author = book.author_name ? book.author_name[0] : 'Unknown author';
            const ratingText = book.ratings_average ? book.ratings_average.toFixed(1) : 'Not rated';
            const coverUrl = book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : '';

            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                ${coverUrl ? `<img src="${coverUrl}" alt="Cover of ${book.title}">` : '<p>No cover</p>'}
                <h3>${book.title}</h3>
                <p>Author: ${author}</p>
                <p>Pages: ${book.number_of_pages_median}</p>
                <p>Rating: ${ratingText}</p>
            `;

            //button that sends this book's page count (from the API) to the calculator
            const useBtn = document.createElement('button');
            useBtn.textContent = 'Use in calculator';
            useBtn.addEventListener('click', function () {
                totalPagesInput.value = book.number_of_pages_median;
            });
            card.appendChild(useBtn);

            //button that saves this book to the READLIST (Local Storage)
            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add to READLIST';
            const feedback = document.createElement('p');
            addBtn.addEventListener('click', function () {
                const saved = loadBooks();
                //don't add the same book twice
                const exists = saved.some(function (b) {
                    return b.title.toLowerCase() === book.title.toLowerCase();
                });
                if (exists) {
                    feedback.textContent = 'Already in your READLIST.';
                    return;
                }
                saved.push({
                    id: Date.now(),
                    title: book.title,
                    author: author,
                    pages: book.number_of_pages_median,
                    pagesRead: 0,
                    status: 'To Read',
                    notes: ''
                });
                saveBooks(saved);
                feedback.textContent = 'Added to your READLIST!';
            });
            card.appendChild(addBtn);

            //details button (API 4)
            if (book.key) card.appendChild(makeDetailsButton(book));

            card.appendChild(feedback);
            suggestion.appendChild(card);
        });

    } catch (error){
        //failed request (no internet, server down)
        suggestion.textContent = 'Could not load suggestions. Please try again.';
        console.log(error);
    }
});
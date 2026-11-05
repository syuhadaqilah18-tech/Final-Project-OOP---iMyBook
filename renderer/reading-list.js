//get reference to html elements (dom)
const formTitle = document.getElementById('formTitle');
const titleInput = document.getElementById('titleInput');
const authorInput = document.getElementById('authorInput');
const pagesInput = document.getElementById('pagesInput');
const readInput = document.getElementById('readInput');
const statusInput = document.getElementById('statusInput');
const notesInput = document.getElementById('notesInput');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formMessage = document.getElementById('formMessage');
const summary = document.getElementById('summary');
const bookList = document.getElementById('bookList');
const savedSuggestions = document.getElementById('savedSuggestions');

//if null, add new book. if it has an id, edit that book
let editingId = null;

//helper: add a line of text to a card
//(textContent is used so typed text can never break the page)
function addLine(card, text){
    const p = document.createElement('p');
    p.textContent = text;
    card.appendChild(p);
}

//helper: show a feedback message (green = success, red = error)
function showMessage(text, isError){
    formMessage.textContent = text;
    formMessage.className = isError ? 'error' : 'success';
}

//empty the form and go back to "add" mode (reset form)
function resetForm(){
    titleInput.value = '';
    authorInput.value = '';
    pagesInput.value = '';
    readInput.value = 0;
    statusInput.value = 'To Read';
    notesInput.value = '';
    editingId = null;
    formTitle.textContent = 'Add a Book';
    saveBtn.textContent = 'Add Book';
    cancelBtn.classList.add('hidden');
}

//READ: show every saved book on the page
function renderList(){
    const books = loadBooks();
    bookList.innerHTML = '';

    //empty readlist
    if (books.length === 0){
        bookList.textContent = 'Your READLIST is empty. Add a book above, or save one from the Discover page.';
        summary.textContent = '';
        return;
    }

    //calculation: totals from the saved list
    let pagesLeft = 0;
    let finishedCount = 0;
    books.forEach(function (book){
        pagesLeft += book.pages - book.pagesRead;
        if (book.status === 'Finished') finishedCount++;
    });
    summary.innerHTML = `
        <p>Total books: <strong>${books.length}</strong> |
        Finished: <strong>${finishedCount}</strong> |
        Pages left to read: <strong>${pagesLeft} pages</strong></p>
    `;

    //build one card per book
    books.forEach(function (book){
        const card = document.createElement('div');
        card.className = 'book-card';

        const title = document.createElement('h3');
        title.textContent = book.title;
        card.appendChild(title);

        addLine(card, 'Author: ' + book.author);
        addLine(card, 'Status: ' + book.status);
        addLine(card, `Progress: ${book.pagesRead} / ${book.pages} pages`);
        if (book.notes) addLine(card, 'Notes: ' + book.notes);

        //UPDATE: loads this book into the form
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', function(){
            editingId = book.id;
            titleInput.value = book.title;
            authorInput.value = book.author;
            pagesInput.value = book.pages;
            readInput.value = book.pagesRead;
            statusInput.value = book.status;
            notesInput.value = book.notes;
            formTitle.textContent = 'Edit Book';
            saveBtn.textContent = 'Update Book';
            cancelBtn.classList.remove('hidden');
            window.scrollTo(0, 0);
        });

        //DELETE: asks first, then removes the book
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'danger';
        deleteBtn.addEventListener('click', function(){
            if (!confirm('Delete "' + book.title + '" from your READLIST?')) return;

            const remaining = loadBooks().filter(function(b){
                return b.id !== book.id;
            });
            saveBooks(remaining);

            //if this book was being edited, clear the form
            if (editingId === book.id) resetForm();

            showMessage('Book deleted.', false);
            renderList();
        });

        card.appendChild(editBtn);
        card.appendChild(deleteBtn);
        bookList.appendChild(card);
    });
}

//show the last suggestions saved by the discover page
function renderSuggestions(){
    const list = loadSuggestions();
    savedSuggestions.innerHTML = '';

    if (list.length === 0){
        savedSuggestions.textContent = 'No suggestions yet. Go to Discover Books to get some.';
        return;
    }

    list.forEach(function(item){
        const card = document.createElement('div');
        card.className = 'book-card';
        const title = document.createElement('h3');
        title.textContent = item.title;
        card.appendChild(title);
        addLine(card, 'Author: ' + item.author);
        addLine(card, 'Pages: ' + item.pages);
        addLine(card, 'Rating: ' + item.rating);
        savedSuggestions.appendChild(card);
    });
}

//CREATE or UPDATE: runs when the user clicks the main button
saveBtn.addEventListener('click', function(){
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const pages = Number(pagesInput.value);
    const pagesRead = Number(readInput.value);
    const status = statusInput.value;
    const notes = notesInput.value.trim();

    //input validation
    if (title === ''){ //title is required
        showMessage('Please enter the book title.', true);
        return;
    }
    if (!pages || pages <= 0){ //pages is required
        showMessage('Total pages must be more than 0.', true);
        return;
    }
    if (pagesRead < 0){ //pages read can't be negative
        showMessage('Pages read cannot be negative.', true);
        return;
    }
    if (pagesRead > pages){ //can't read more than the total
        showMessage('Pages read cannot be more than the total pages.', true);
        return;
    }

    const books = loadBooks();

    if (editingId === null){
        //CREATE: build a new record and add it to the array
        const newBook = {
            id: Date.now(), //unique id based on the current time
            title: title,
            author: author || 'Unknown author',
            pages: pages,
            pagesRead: pagesRead,
            status: status,
            notes: notes
        };
        books.push(newBook);
        saveBooks(books);
        showMessage('Book added to your READLIST.', false);
    } else {
        //UPDATE: find the book with the matching id and change its values
        const book = books.find(function(b){
            return b.id === editingId;
        });

        if (book){
            book.title = title;
            book.author = author || 'Unknown author';
            book.pages = pages;
            book.pagesRead = pagesRead;
            book.status = status;
            book.notes = notes;
            saveBooks(books);
            showMessage('Book updated.', false);
        }
    }

    resetForm();
    renderList();
});

//cancel editing and go back to "add" mode
cancelBtn.addEventListener('click', function(){
    resetForm();
    showMessage('Edit cancelled.', false);
});

//run when the page opens: show saved data from Local Storage
renderList();
renderSuggestions();
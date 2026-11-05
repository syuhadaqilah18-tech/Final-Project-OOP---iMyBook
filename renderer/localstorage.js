//CRUD OPERATIONS (p2)
//keys under which data is stored in local storage
const BOOKS_KEY = 'imybook_readingList';
const SUGGEST_KEY = 'imybook_suggestions';

//CLASS: blueprint for one book in the READLIST
class Book {
    constructor({ id, title, author, pages, pagesRead, status, notes }){
        this.id = id || Date.now();           //unique id based on the current time
        this.title = title;
        this.author = author || 'Unknown author';
        this.pages = pages;
        this.pagesRead = pagesRead || 0;
        this.status = status || 'To Read';
        this.notes = notes || '';
    }

    //method: pages still to read
    pagesLeft(){
        return this.pages - this.pagesRead;
    }

    //method: progress as a percentage
    progressPercent(){
        return Math.round((this.pagesRead / this.pages) * 100);
    }
}

//READ: get the reading list. local storage only holds text,
//so JSON.parse turns the text back into plain objects (deserialization).
//Plain objects lose their methods, so each one is rebuilt as a Book object.
function loadBooks(){
    try{
        const text = localStorage.getItem(BOOKS_KEY);
        return text
            ? JSON.parse(text).map(function (obj){ return new Book(obj); })
            : [];
    } catch (error){
        console.log('Could not read the READLIST:', error);
        return []; //if saved data is broken, start with an empty list
    }
}

//WRITE: JSON.stringify turns the array into text (serialization) so it can be stored
function saveBooks(books){
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

//READ: get the latest suggestions saved by the Discover page
function loadSuggestions(){
    try{
        const text = localStorage.getItem(SUGGEST_KEY);
        return text ? JSON.parse(text) : [];
    } catch (error) {
        console.log('Could not read the suggestions:', error);
        return [];
    }
}

//WRITE: save the latest suggestions
function saveSuggestions(list){
    localStorage.setItem(SUGGEST_KEY, JSON.stringify(list));
}

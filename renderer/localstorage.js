//CRUD OPERATIONS (p2)
//keys under which data is stored in local storage
const BOOKS_KEY = 'imybook_readingList';
const SUGGEST_KEY = 'imybook_suggestions';

//READ: get the reading list. local storage only holds text,
//so JSON.parse turns the text back into an array (deserialization)
function loadBooks(){
    try{
        const text = localStorage.getItem(BOOKS_KEY);
        return text ? JSON.parse(text) : [];
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
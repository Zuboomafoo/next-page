import React, { useState, useEffect } from 'react';

function SimpleApp() {
  const [books, setBooks] = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  
  // Add a book to the read books list
  const addBook = () => {
    if (!title.trim()) return;
    
    setBooks([...books, {
      id: Date.now(),
      title,
      author: author || 'Unknown Author',
      rating,
      genre: 'Unknown'
    }]);
    
    setTitle('');
    setAuthor('');
    setRating(5);
  };
  
  // Add to reading list
  const addToReadingList = (book) => {
    setReadingList([...readingList, book]);
  };
  
  // Remove from books
  const removeBook = (id) => {
    setBooks(books.filter(book => book.id !== id));
  };
  
  // Remove from reading list
  const removeFromList = (id) => {
    setReadingList(readingList.filter(book => book.id !== id));
  };
  
  // Sample recommendations
  const recommendations = [
    {
      id: 101,
      title: "Brave New World",
      author: "Aldous Huxley",
      genre: "Science Fiction",
      description: "A dystopian novel set in a futuristic World State."
    },
    {
      id: 102,
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
      genre: "Fantasy",
      description: "The tale of Kvothe, a magically gifted young man."
    },
    {
      id: 103,
      title: "The Hitchhiker's Guide to the Galaxy",
      author: "Douglas Adams",
      genre: "Science Fiction",
      description: "The comedic adventures of Arthur Dent across space."
    }
  ];
  
  // Render stars for ratings
  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };
  
  // Calculate stats
  const averageRating = books.length 
    ? (books.reduce((sum, book) => sum + book.rating, 0) / books.length).toFixed(1) 
    : 0;
  
  return (
    <div className="container mt-4 mb-4">
      <h1 className="text-center mb-4" style={{fontFamily: "'Noto Serif Display', serif", fontStyle: "italic"}}>Next Page</h1>
      
      {/* Add Books Form */}
      <div className="card mb-4">
        <div className="card-header">Add Books You've Read</div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Book Title</label>
            <input 
              type="text" 
              className="form-control" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Author (optional)</label>
            <input 
              type="text" 
              className="form-control" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Your Rating</label>
            <div>
              <div className="star-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className="star" 
                    style={{cursor: 'pointer', color: star <= rating ? 'gold' : 'gray'}}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-1 text-muted small">
              {rating === 0 ? "No rating" : 
               rating <= 1.5 ? "Hated it" :
               rating <= 2.5 ? "Not for me" :
               rating <= 3.5 ? "Pretty decent" :
               rating <= 4.5 ? "I liked it" : "Loved it"}
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={addBook}>Add Book</button>
        </div>
      </div>
      
      {/* Stats Dashboard */}
      <div className="card mb-4">
        <div className="card-header">Your Reading Stats</div>
        <div className="card-body">
          {books.length === 0 ? (
            <p className="text-muted">Add some books to see your stats.</p>
          ) : (
            <div className="row">
              <div className="col-md-4 text-center">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5>Total Books</h5>
                    <h2>{books.length}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5>Average Rating</h5>
                    <h2>{averageRating}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5>Top Genre</h5>
                    <h2>N/A</h2>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Library */}
      <div className="card mb-4">
        <div className="card-header">Your Library</div>
        <div className="card-body">
          <div className="row">
            {/* Books You've Read */}
            <div className="col-md-6">
              <h5>Books You've Read</h5>
              {books.length === 0 ? (
                <p className="text-muted">You haven't added any books yet.</p>
              ) : (
                <div className="list-group">
                  {books.map(book => (
                    <div key={book.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6>{book.title}</h6>
                          <p className="mb-1 text-muted">by {book.author}</p>
                          <div style={{color: 'gold'}}>{renderStars(book.rating)}</div>
                        </div>
                        <div>
                          <button className="btn btn-sm btn-danger me-2" onClick={() => removeBook(book.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Reading List */}
            <div className="col-md-6">
              <h5>Reading List</h5>
              {readingList.length === 0 ? (
                <p className="text-muted">Your reading list is empty. Add books from recommendations.</p>
              ) : (
                <div className="list-group">
                  {readingList.map((book, index) => (
                    <div key={book.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex">
                          <span className="badge bg-secondary rounded-circle me-2">{index + 1}</span>
                          <div>
                            <h6>{book.title}</h6>
                            <p className="mb-0 text-muted">by {book.author}</p>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-danger" onClick={() => removeFromList(book.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="card">
        <div className="card-header">Recommended Books</div>
        <div className="card-body">
          {books.length === 0 ? (
            <p className="text-muted">Add some books you've read to get recommendations</p>
          ) : (
            <div className="row">
              {recommendations.map(book => (
                <div key={book.id} className="col-md-12 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">{book.title}</h5>
                      <h6 className="card-subtitle mb-2 text-muted">by {book.author}</h6>
                      <p className="card-text">{book.description}</p>
                      <div className="mb-2">Genre: {book.genre}</div>
                      <div>
                        <button className="btn btn-success me-2" onClick={() => addToReadingList(book)}>
                          Add to Reading List
                        </button>
                        <button className="btn btn-primary me-2">
                          I've Read This
                        </button>
                        <button className="btn btn-warning me-2">
                          Why this book?
                        </button>
                        <a href="#" className="btn btn-warning">
                          Buy on Amazon
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;

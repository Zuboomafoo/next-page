import React, { useState, useEffect, useCallback } from 'react';

function SimpleApp() {
  // State for user's books and reading list
  const [books, setBooks] = useState([]);
  const [readingList, setReadingList] = useState([]);
  
  // State for book search and form
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // State for recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  
  // State for popups
  const [showReason, setShowReason] = useState(null);
  const [showRatingPopup, setShowRatingPopup] = useState(null);
  const [tempRating, setTempRating] = useState(5);
  
  // State for feedback
  const [feedbackMap, setFeedbackMap] = useState({});
  
  // Load books from localStorage on initial load
  useEffect(() => {
    const savedBooks = localStorage.getItem('nextpage_books');
    const savedReadingList = localStorage.getItem('nextpage_readingList');
    const savedFeedback = localStorage.getItem('nextpage_feedback');
    
    if (savedBooks) {
      try {
        setBooks(JSON.parse(savedBooks));
      } catch (e) {
        console.error('Error loading saved books:', e);
      }
    }
    
    if (savedReadingList) {
      try {
        setReadingList(JSON.parse(savedReadingList));
      } catch (e) {
        console.error('Error loading saved reading list:', e);
      }
    }
    
    if (savedFeedback) {
      try {
        setFeedbackMap(JSON.parse(savedFeedback));
      } catch (e) {
        console.error('Error loading saved feedback:', e);
      }
    }
  }, []);
  
  // Save books to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('nextpage_books', JSON.stringify(books));
  }, [books]);
  
  // Save reading list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nextpage_readingList', JSON.stringify(readingList));
  }, [readingList]);
  
  // Save feedback to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nextpage_feedback', JSON.stringify(feedbackMap));
  }, [feedbackMap]);
  
// Google Books API search function with API key and error handling
const searchBooks = useCallback(async (query) => {
  if (!query || query.trim().length < 3) return [];
  
  try {
    console.log("Searching for books with query:", query);
    
    // Use a CORS proxy if needed (remove if not required)
    const corsProxy = "https://corsproxy.io/?";
    const apiKey = "AIzaSyDo8wQLqk9-W0XgnhjFmGSxfAY_FVOyXJg";
    
    const response = await fetch(
      `${corsProxy}https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&key=${apiKey}`
    );
    
    if (!response.ok) {
      console.error("API Response not OK:", response.status, response.statusText);
      throw new Error(`Failed to fetch from Google Books API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API Response:", data);
    
    if (!data.items || data.items.length === 0) {
      console.log("No books found for query:", query);
      return [];
    }
    
    return data.items.map(item => {
      const info = item.volumeInfo || {};
      return {
        id: item.id,
        title: info.title || 'Unknown Title',
        author: info.authors ? info.authors.join(', ') : 'Unknown Author',
        genre: info.categories ? info.categories[0] : 'Unknown',
        description: info.description || 'No description available',
        coverImage: info.imageLinks?.thumbnail || null,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        averageRating: info.averageRating,
        language: info.language || 'en',
        asin: info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
      };
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
}, []);

// Generate recommendations based on user's books with API key and error handling
const fetchRecommendations = useCallback(async () => {
  if (books.length === 0) return;
  setRecLoading(true);
  
  try {
    // Collect genres from user's books
    const genres = books
      .map(book => book.genre)
      .filter(genre => genre && genre !== 'Unknown');
    
    // Get genre counts
    const genreCounts = {};
    genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    // Sort genres by count
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    // Get top genre or default to fiction
    const targetGenre = sortedGenres[0] || 'fiction';
    console.log("Fetching recommendations for genre:", targetGenre);
    
    // Use a CORS proxy if needed (remove if not required)
    const corsProxy = "https://corsproxy.io/?";
    
    // Add an API key (you'll need to get one from Google Cloud Console)
    const apiKey = "YOUR_API_KEY"; // Replace with your actual API key
    
    const response = await fetch(
      `${corsProxy}https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(targetGenre)}&maxResults=10&key=${apiKey}`
    );
    
    if (!response.ok) {
      console.error("API Response not OK:", response.status, response.statusText);
      throw new Error(`Failed to fetch recommendations: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Recommendations API Response:", data);
    
    if (!data.items || data.items.length === 0) {
      console.log("No recommendations found for genre:", targetGenre);
      setRecommendations([]);
      setRecLoading(false);
      return;
    }
    
    // Rest of your recommendation processing code remains the same...
    const formattedRecs = data.items.map(item => {
      const info = item.volumeInfo || {};
      return {
        id: item.id,
        title: info.title || 'Unknown Title',
        author: info.authors ? info.authors.join(', ') : 'Unknown Author',
        genre: info.categories ? info.categories[0] : targetGenre,
        description: info.description || 'No description available',
        coverImage: info.imageLinks?.thumbnail || null,
        score: ((info.averageRating || 3.5) * 2).toFixed(1),
        similarityScore: (Math.random() * 0.6 + 0.2).toFixed(2),
        asin: info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier,
        reasoning: `Based on your interest in ${targetGenre} books, you might enjoy this ${info.categories ? info.categories[0] : targetGenre} novel. ${info.authors ? info.authors[0] : 'This author'}'s writing style and themes align with your reading preferences.`
      };
    });
    
    // Filter out books the user already has
    const filteredRecs = formattedRecs.filter(
      rec => !books.some(book => book.id === rec.id) && 
             !readingList.some(book => book.id === rec.id)
    );
    
    // Apply feedback adjustments
    const adjustedRecs = filteredRecs.map(rec => {
      if (feedbackMap[rec.id] === 'like') {
        return { ...rec, score: (parseFloat(rec.score) + 1.5).toFixed(1) };
      } else if (feedbackMap[rec.id] === 'dislike') {
        return { ...rec, score: Math.max(0, parseFloat(rec.score) - 2).toFixed(1) };
      }
      return rec;
    });
    
    // Sort by score
    const sortedRecs = [...adjustedRecs].sort((a, b) => 
      parseFloat(b.score) - parseFloat(a.score)
    );
    
    setRecommendations(sortedRecs);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    setRecommendations([]);
  } finally {
    setRecLoading(false);
  }
}, [books, readingList, feedbackMap]);

// Alternative implementation that doesn't rely on the external API
// You can use this while waiting for API access
const fetchMockRecommendations = useCallback(() => {
  if (books.length === 0) return;
  setRecLoading(true);
  
  try {
    console.log("Generating mock recommendations");
    
    // Sample genres based on user's books or default to fiction
    const genres = books
      .map(book => book.genre)
      .filter(genre => genre && genre !== 'Unknown');
    
    const topGenre = genres.length > 0 
      ? genres.reduce((a, b) => genres.filter(v => v === a).length >= genres.filter(v => v === b).length ? a : b, null)
      : 'Fiction';
    
    // Mock book data
    const mockBooks = [
      {
        id: 'mock1',
        title: 'The Lost Symbol',
        author: 'Dan Brown',
        genre: 'Thriller',
        description: 'Robert Langdon races to uncover secrets in Washington D.C. related to the Freemasons.',
        coverImage: 'https://m.media-amazon.com/images/I/81WcnNQ-TBL._AC_UF1000,1000_QL80_.jpg',
        score: '7.8',
        similarityScore: '0.72',
        asin: '0385504225',
        reasoning: `Based on your reading history, you might enjoy this fast-paced thriller. Dan Brown's writing style combines history and suspense.`
      },
      {
        id: 'mock2',
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        description: 'A stunning blend of adventure and mysticism, environmentalism and politics, this epic novel follows Paul Atreides as he becomes ruler of a desert planet.',
        coverImage: 'https://m.media-amazon.com/images/I/A1u+2fY5yTL._AC_UF1000,1000_QL80_.jpg',
        score: '8.9',
        similarityScore: '0.65',
        asin: '0441172717',
        reasoning: `This science fiction masterpiece offers rich world-building and complex characters that align with your reading preferences.`
      },
      {
        id: 'mock3',
        title: 'The Night Circus',
        author: 'Erin Morgenstern',
        genre: 'Fantasy',
        description: 'The circus arrives without warning. No announcements precede it. It is simply there, when yesterday it was not.',
        coverImage: 'https://m.media-amazon.com/images/I/91HOTLAE9ML._AC_UF1000,1000_QL80_.jpg',
        score: '8.2',
        similarityScore: '0.68',
        asin: '0385534639',
        reasoning: `This imaginative fantasy novel features beautiful prose and magical elements that match your interest in immersive storytelling.`
      },
      {
        id: 'mock4',
        title: 'Where the Crawdads Sing',
        author: 'Delia Owens',
        genre: 'Fiction',
        description: 'For years, rumors of the "Marsh Girl" have haunted Barkley Cove, a quiet town on the North Carolina coast.',
        coverImage: 'https://m.media-amazon.com/images/I/81O1oy0y9eL._AC_UF1000,1000_QL80_.jpg',
        score: '8.5',
        similarityScore: '0.70',
        asin: '0735219095',
        reasoning: `This compelling story combines mystery and coming-of-age elements with beautiful nature writing.`
      },
      {
        id: 'mock5',
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        genre: 'Fiction',
        description: 'A special 25th anniversary edition of Paulo Coelho's extraordinary international bestselling phenomenon.',
        coverImage: 'https://m.media-amazon.com/images/I/51Z0nLAfLmL.jpg',
        score: '7.9',
        similarityScore: '0.62',
        asin: '0062315005',
        reasoning: `This philosophical novel about following your dreams has resonated with millions of readers worldwide.`
      }
    ];
    
    // Filter the mocks to match some genres from the user's books
    const relevantBooks = mockBooks.filter(book => 
      !books.some(userBook => userBook.id === book.id) && 
      !readingList.some(userBook => userBook.id === book.id)
    );
    
    // Apply feedback adjustments
    const adjustedRecs = relevantBooks.map(rec => {
      if (feedbackMap[rec.id] === 'like') {
        return { ...rec, score: (parseFloat(rec.score) + 1.5).toFixed(1) };
      } else if (feedbackMap[rec.id] === 'dislike') {
        return { ...rec, score: Math.max(0, parseFloat(rec.score) - 2).toFixed(1) };
      }
      return rec;
    });
    
    // Sort by score
    const sortedRecs = [...adjustedRecs].sort((a, b) => 
      parseFloat(b.score) - parseFloat(a.score)
    );
    
    console.log("Mock recommendations generated:", sortedRecs);
    setRecommendations(sortedRecs);
  } catch (error) {
    console.error('Error generating mock recommendations:', error);
    setRecommendations([]);
  } finally {
    setRecLoading(false);
  }
}, [books, readingList, feedbackMap]);
      // Format recommendations
      const formattedRecs = data.items.map(item => {
        const info = item.volumeInfo || {};
        return {
          id: item.id,
          title: info.title || 'Unknown Title',
          author: info.authors ? info.authors.join(', ') : 'Unknown Author',
          genre: info.categories ? info.categories[0] : targetGenre,
          description: info.description || 'No description available',
          coverImage: info.imageLinks?.thumbnail || null,
          score: ((info.averageRating || 3.5) * 2).toFixed(1),
          similarityScore: (Math.random() * 0.6 + 0.2).toFixed(2),
          asin: info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier,
          reasoning: `Based on your interest in ${targetGenre} books, you might enjoy this ${info.categories ? info.categories[0] : targetGenre} novel. ${info.authors ? info.authors[0] : 'This author'}'s writing style and themes align with your reading preferences.`
        };
      });
      
      // Filter out books the user already has
      const filteredRecs = formattedRecs.filter(
        rec => !books.some(book => book.id === rec.id) && 
               !readingList.some(book => book.id === rec.id)
      );
      
      // Apply feedback adjustments
      const adjustedRecs = filteredRecs.map(rec => {
        if (feedbackMap[rec.id] === 'like') {
          return { ...rec, score: (parseFloat(rec.score) + 1.5).toFixed(1) };
        } else if (feedbackMap[rec.id] === 'dislike') {
          return { ...rec, score: Math.max(0, parseFloat(rec.score) - 2).toFixed(1) };
        }
        return rec;
      });
      
      // Sort by score
      const sortedRecs = [...adjustedRecs].sort((a, b) => 
        parseFloat(b.score) - parseFloat(a.score)
      );
      
      setRecommendations(sortedRecs);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setRecLoading(false);
    }
  }, [books, readingList, feedbackMap]);
  
  // Fetch recommendations when books or reading list change
  useEffect(() => {
    fetchRecommendations();
  }, [books, readingList, feedbackMap, fetchRecommendations]);
  
  // Add a book to read books
  const addBook = (book) => {
    const newRating = typeof rating === 'number' ? rating : 5;
    
    // Add fields if we need to create a new book object
    const bookToAdd = {
      ...book,
      id: book.id || Date.now().toString(),
      rating: newRating,
      dateAdded: new Date().toISOString()
    };
    
    // Check if already in collection
    if (books.some(b => b.id === bookToAdd.id)) {
      return;
    }
    
    // If in reading list, remove from there
    if (readingList.some(b => b.id === bookToAdd.id)) {
      setReadingList(readingList.filter(b => b.id !== bookToAdd.id));
    }
    
    setBooks([...books, bookToAdd]);
    setTitle('');
    setAuthor('');
    setRating(5);
  };
  
  // Add to reading list
  const addToReadingList = (book) => {
    // Check if already in collection
    if (readingList.some(b => b.id === book.id) || books.some(b => b.id === book.id)) {
      return;
    }
    
    setReadingList([...readingList, book]);
  };
  
  // Remove book
  const removeBook = (id) => {
    setBooks(books.filter(book => book.id !== id));
  };
  
  // Remove from reading list
  const removeFromReadingList = (id) => {
    setReadingList(readingList.filter(book => book.id !== id));
  };
  
  // Update a book's rating
  const updateBookRating = (bookId, newRating) => {
    setBooks(books.map(book => 
      book.id === bookId 
        ? { ...book, rating: newRating }
        : book
    ));
  };
  
  // Move book to reading list
  const moveToReadingList = (book) => {
    removeBook(book.id);
    addToReadingList(book);
  };
  
  // Mark as read from reading list
  const markAsRead = (book) => {
    removeFromReadingList(book.id);
    addBook({...book, rating: 5});
  };
  
  // Submit rating from the "I've read this" dialog
  const submitRating = () => {
    if (!showRatingPopup) return;
    
    const book = recommendations.find(b => b.id === showRatingPopup);
    if (book) {
      addBook({...book, rating: tempRating});
    }
    
    setShowRatingPopup(null);
  };
  
  // Handle feedback on recommendations
  const handleFeedback = (bookId, type) => {
    setFeedbackMap(prev => {
      // If same feedback type, toggle it off
      if (prev[bookId] === type) {
        const newMap = {...prev};
        delete newMap[bookId];
        return newMap;
      }
      // Otherwise set new feedback
      return {...prev, [bookId]: type};
    });
  };
  
  // Generate Amazon affiliate link
  const getAmazonLink = (asin) => {
    if (!asin) return '#';
    return `https://www.amazon.com/dp/${asin}?tag=zuboomafoo-20`;
  };
  
  // Select a book from search results
  const selectBook = (book) => {
    setTitle(book.title);
    setAuthor(book.author);
    setShowSearchResults(false);
  };
  
  // Handle book form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    // Find matching book in search results
    const matchingBook = searchResults.find(
      book => book.title.toLowerCase() === title.toLowerCase()
    );
    
    if (matchingBook) {
      addBook({...matchingBook, rating});
    } else {
      // Create a basic book object
      addBook({
        id: Date.now().toString(),
        title,
        author: author || 'Unknown Author',
        genre: 'Unknown',
        description: 'No description available',
        coverImage: null,
        rating
      });
    }
  };
  
  // Filter recommendations by genre if requested
  const filteredRecs = selectedGenre 
    ? recommendations.filter(book => book.genre === selectedGenre)
    : recommendations;
  
  // Get all genres from recommendations
  const recGenres = [...new Set(recommendations.map(book => book.genre))].filter(Boolean);
  
  // Calculate statistics
  const averageRating = books.length 
    ? (books.reduce((sum, book) => sum + (book.rating || 0), 0) / books.length).toFixed(1) 
    : 0;
  
  const getTopGenre = () => {
    const genres = books.map(book => book.genre).filter(g => g && g !== 'Unknown');
    if (genres.length === 0) return 'N/A';
    
    const counts = {};
    genres.forEach(genre => {
      counts[genre] = (counts[genre] || 0) + 1;
    });
    
    let topGenre = null;
    let maxCount = 0;
    
    for (const genre in counts) {
      if (counts[genre] > maxCount) {
        maxCount = counts[genre];
        topGenre = genre;
      }
    }
    
    return topGenre || 'N/A';
  };
  
  // Star rating component
  const StarRating = ({ value, onChange, size = "normal" }) => {
    const [hover, setHover] = useState(null);
    
    const getStarText = (rating) => {
      if (rating === 0) return "No rating";
      if (rating <= 1.5) return "Hated it";
      if (rating <= 2.5) return "Not for me";
      if (rating <= 3.5) return "Pretty decent";
      if (rating <= 4.5) return "I liked it";
      return "Loved it";
    };
    
    const sizeClass = size === "small" ? "fs-5" : size === "large" ? "fs-3" : "fs-4";
    const currentValue = hover !== null ? hover : value;
    
    return (
      <div>
        <div 
          className="star-rating d-flex align-items-center" 
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map(star => (
            <div 
              key={star}
              className={`${sizeClass} position-relative`}
              style={{
                cursor: onChange ? 'pointer' : 'default',
                color: star <= Math.floor(currentValue) ? 'gold' : 
                       (star - 0.5) <= currentValue ? 'gold' : '#ccc',
                width: '1.2em',
                height: '1.2em',
                textAlign: 'center'
              }}
            >
              {/* Full star */}
              <span style={{position: 'absolute', top: 0, left: 0}}>★</span>
              
              {/* Half star overlays */}
              {onChange && (
                <>
                  {/* Left half (for half star) */}
                  <span 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    onClick={() => onChange(star - 0.5)}
                    onMouseEnter={() => setHover(star - 0.5)}
                  ></span>
                  
                  {/* Right half (for full star) */}
                  <span 
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '50%',
                      height: '100%',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                  ></span>
                </>
              )}
            </div>
          ))}
          
          {onChange && hover !== null && (
            <span className="ms-2 text-secondary small">
              {getStarText(hover)}
            </span>
          )}
        </div>
        
        {onChange && hover === null && value > 0 && (
          <div className="text-secondary small mt-1">
            {getStarText(value)}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="container my-4">
      <h1 className="text-center mb-4 fw-bold" style={{fontStyle: 'italic', fontFamily: 'serif'}}>
        Next Page
      </h1>
      
      {/* Book Form */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Add Books You've Read</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3 position-relative">
              <label className="form-label">Book Title</label>
              <input 
                type="text" 
                className="form-control" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Search for a book title"
              />
              
              {searchLoading && (
                <div className="mt-1 text-secondary small">Searching books...</div>
              )}
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{zIndex: 1000, maxHeight: '300px', overflow: 'auto'}}>
                  {searchResults.map(book => (
                    <div 
                      key={book.id}
                      className="p-2 border-bottom d-flex align-items-center"
                      style={{cursor: 'pointer'}}
                      onClick={() => selectBook(book)}
                    >
                      {book.coverImage && (
                        <img 
                          src={book.coverImage} 
                          alt="" 
                          className="me-2"
                          style={{width: '40px', height: '60px', objectFit: 'cover'}}
                        />
                      )}
                      <div>
                        <div className="fw-medium">{book.title}</div>
                        <div className="small text-secondary">by {book.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <StarRating 
                value={rating} 
                onChange={setRating} 
                size="normal"
              />
            </div>
            
            <button type="submit" className="btn btn-primary">Add Book</button>
          </form>
        </div>
      </div>
      
      {/* Stats Dashboard */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Your Reading Stats</h5>
        </div>
        <div className="card-body">
          {books.length === 0 ? (
            <p className="text-secondary mb-0">Add some books to see your stats.</p>
          ) : (
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Total Books</h6>
                    <h2 className="display-4 fw-bold">{books.length}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Average Rating</h6>
                    <h2 className="display-4 fw-bold">{averageRating}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 bg-light">
                  <div className="card-body text-center">
                    <h6 className="card-title">Top Genre</h6>
                    <h2 className="display-4 fw-bold">{getTopGenre()}</h2>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Library */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Your Library</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Books You've Read */}
            <div className="col-md-6">
              <h6 className="mb-3">Books You've Read</h6>
              {books.length === 0 ? (
                <p className="text-secondary">You haven't added any books yet.</p>
              ) : (
                <div className="overflow-auto" style={{maxHeight: '500px'}}>
                  {books.map(book => (
                    <div key={book.id} className="card mb-2">
                      <div className="card-body p-3">
                        <div className="d-flex">
                          {book.coverImage && (
                            <img 
                              src={book.coverImage} 
                              alt="" 
                              className="me-3"
                              style={{width: '50px', height: '75px', objectFit: 'cover'}}
                            />
                          )}
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{book.title}</h6>
                            <p className="mb-1 text-secondary small">by {book.author}</p>
                            <div className="mb-2">
                              <StarRating 
                                value={book.rating || 0} 
                                onChange={(newRating) => updateBookRating(book.id, newRating)} 
                                size="small"
                              />
                            </div>
                            <div className="d-flex">
                              <button 
                                className="btn btn-outline-danger btn-sm me-2"
                                onClick={() => removeBook(book.id)}
                              >
                                Remove
                              </button>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => moveToReadingList(book)}
                              >
                                Move to Reading List
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Reading List */}
            <div className="col-md-6">
              <h6 className="mb-3">Reading List</h6>
              {readingList.length === 0 ? (
                <p className="text-secondary">Your reading list is empty. Add books from recommendations.</p>
              ) : (
                <div className="overflow-auto" style={{maxHeight: '500px'}}>
                  {readingList.map((book, index) => (
                    <div key={book.id} className="card mb-2">
                      <div className="card-body p-3">
                        <div className="d-flex">
                          <div className="me-3 d-flex align-items-center">
                            <span className="badge bg-secondary rounded-circle p-2">{index + 1}</span>
                          </div>
                          {book.coverImage && (
                            <img 
                              src={book.coverImage} 
                              alt="" 
                              className="me-3"
                              style={{width: '50px', height: '75px', objectFit: 'cover'}}
                            />
                          )}
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{book.title}</h6>
                            <p className="mb-1 text-secondary small">by {book.author}</p>
                            <div className="d-flex">
                              <button 
                                className="btn btn-outline-danger btn-sm me-2"
                                onClick={() => removeFromReadingList(book.id)}
                              >
                                Remove
                              </button>
                              <button 
                                className="btn btn-outline-success btn-sm"
                                onClick={() => markAsRead(book)}
                              >
                                Mark as Read
                              </button>
                            </div>
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
      </div>
      
      {/* Recommendations */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Recommended Books</h5>
        </div>
        <div className="card-body">
          {books.length === 0 ? (
            <p className="text-secondary">Add some books you've read to get recommendations</p>
          ) : recLoading ? (
            <p className="text-secondary">Loading recommendations...</p>
          ) : recommendations.length === 0 ? (
            <p className="text-secondary">No recommendations found based on your preferences</p>
          ) : (
            <>
              {/* Genre filter */}
              <div className="mb-3">
                <div className="d-flex align-items-center mb-3">
                  <label className="form-label mb-0 me-2">Filter by Genre:</label>
                  <select 
                    className="form-select w-auto"
                    value={selectedGenre || ''}
                    onChange={(e) => setSelectedGenre(e.target.value || null)}
                  >
                    <option value="">All Genres</option>
                    {recGenres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                
                <p className="small text-secondary mb-3">
                  <span className="me-2">💡</span>
                  Recommendations are personalized based on your reading history and preferences.
                </p>
              </div>
              
              {filteredRecs.length === 0 ? (
                <p className="text-secondary">No recommendations found for the selected genre</p>
              ) : (
                <div>
                  {filteredRecs.slice(0, 5).map(book => (
                    <div key={book.id} className="card mb-3">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-2 mb-3 mb-md-0 text-center">
                            {book.coverImage ? (
                              <img 
                                src={book.coverImage} 
                                alt="" 
                                className="img-fluid"
                                style={{maxHeight: '150px'}}
                              />
                            ) : (
                              <div className="bg-light d-flex align-items-center justify-content-center" style={{height: '150px', width: '100px', margin: '0 auto'}}>
                                <span className="text-secondary">No cover</span>
                              </div>
                            )}
                          </div>
                          <div className="col-md-10">
                            <h5 className="card-title">{book.title}</h5>
                            <h6 className="card-subtitle mb-2 text-secondary">by {book.author}</h6>
                            <p className="card-text small">{book.description}</p>
                            
                            {book.similarityScore && parseFloat(book.similarityScore) > 0 && (
                              <div className="mb-2">
                                <span className="badge bg-primary rounded-pill">
                                  Content similarity: {(parseFloat(book.similarityScore) * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            
                            <div className="d-flex flex-wrap gap-2 mt-3">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => addToReadingList(book)}
                              >
                                Add to Reading List
                              </button>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setTempRating(5);
                                  setShowRatingPopup(book.id);
                                }}
                              >
                                I've Read This
                              </button>
                              <button 
                                className={`btn btn-sm ${feedbackMap[book.id] === 'like' ? 'btn-success' : 'btn-outline-success'}`}
                                onClick={() => handleFeedback(book.id, 'like')}
                              >
                                👍 Like
                              </button>
                              <button 
                                className={`btn btn-sm ${feedbackMap[book.id] === 'dislike' ? 'btn-danger' : 'btn-outline-danger'}`}
                                onClick={() => handleFeedback(book.id, 'dislike')}
                              >
                                👎 Dislike
                              </button>
                              <button 
                                className="btn btn-info btn-sm text-white"
                                onClick={() => setShowReason(book.id)}
                              >
                                Why this book?
                              </button>
                              {book.asin && (
                                <a 
                                  href={getAmazonLink(book.asin)} 
                                  target="_blank" 
                                  rel="noreferrer noopener"
                                  className="btn btn-warning btn-sm"
                                >
                                  Buy on Amazon
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* "Why this book?" Modal */}
      {showReason && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Why We Recommend This Book</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReason(null)}
                ></button>
              </div>
              <div className="modal-body">
                {recommendations.find(book => book.id === showReason) && (
                  <div>
                    <div className="d-flex mb-3">
                      {recommendations.find(book => book.id === showReason).coverImage && (
                        <img 
                          src={recommendations.find(book => book.id === showReason).coverImage} 
                          alt="" 
                          className="me-3"
                          style={{width: '60px', height: '90px', objectFit: 'cover'}}
                        />
                      )}
                      <div>
                        <h5>{recommendations.find(book => book.id === showReason).title}</h5>
                        <p className="text-secondary mb-0">
                          by {recommendations.find(book => book.id === showReason).author}
                        </p>
                      </div>
                    </div>
                    <p>{recommendations.find(book => book.id === showReason).reasoning}</p>
                    {recommendations.find(book => book.id === showReason).similarityScore && (
                      <div className="mb-3">
                        <span className="badge bg-primary">
                          Content similarity: {(parseFloat(recommendations.find(book => book.id === showReason).similarityScore) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReason(null)}
                >
                  Close
                </button>
                {recommendations.find(book => book.id === showReason)?.asin && (
                  <a
                    href={getAmazonLink(recommendations.find(book => book.id === showReason).asin)}
                    target="_blank" 
                    rel="noreferrer noopener"
                    className="btn btn-warning"
                  >
                    View on Amazon
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* "I've Read This" Modal */}
      {showRatingPopup && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rate This Book</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRatingPopup(null)}
                ></button>
              </div>
              <div className="modal-body">
                {recommendations.find(book => book.id === showRatingPopup) && (
                  <div>
                    <div className="d-flex mb-3 align-items-center">
                      {recommendations.find(book => book.id === showRatingPopup).coverImage && (
                        <img 
                          src={recommendations.find(book => book.id === showRatingPopup).coverImage} 
                          alt="" 
                          className="me-3"
                          style={{width: '60px', height: '90px', objectFit: 'cover'}}
                        />
                      )}
                      <div>
                        <h5 className="mb-1">{recommendations.find(book => book.id === showRatingPopup).title}</h5>
                        <p className="text-secondary mb-0">
                          by {recommendations.find(book => book.id === showRatingPopup).author}
                        </p>
                      </div>
                    </div>
                    <p className="mb-3">How would you rate this book?</p>
                    <div className="text-center mb-3">
                      <StarRating 
                        value={tempRating} 
                        onChange={setTempRating} 
                        size="large"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRatingPopup(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitRating}
                >
                  Add to Read Books
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleApp;
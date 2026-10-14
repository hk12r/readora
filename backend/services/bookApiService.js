// External Book API Service integrating Open Library and Google Books

async function searchOpenLibrary(query, limit = 20) {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.docs || []).map((book) => {
      const isbn = book.isbn ? book.isbn[0] : null;
      return {
        id: book.key || isbn || Math.random().toString(),
        title: book.title || "Untitled",
        author: (book.author_name && book.author_name[0]) || "Unknown Author",
        isbn: isbn || "0000000000000",
        pages: book.number_of_pages_median || 320,
        genre: (book.subject && book.subject[0]) || "Fiction",
        rating: book.ratings_average ? Math.round(book.ratings_average * 10) / 10 : 4.2,
        cover: isbn
          ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
          : book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600",
        blurb:
          book.first_sentence && book.first_sentence[0]
            ? book.first_sentence[0]
            : "A captivating exploration of character, circumstance, and the timeless pull of human curiosity.",
        publicationYear: book.first_publish_year || 2020,
        country: "International",
        pace: "Medium",
        moods: ["Thought-provoking", "Something new"],
        source: "openlibrary",
      };
    });
  } catch (error) {
    console.error("Open Library error:", error.message);
    return [];
  }
}

async function searchGoogleBooks(query, limit = 20) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&maxResults=${Math.min(limit, 40)}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item) => {
      const info = item.volumeInfo || {};
      const identifiers = info.industryIdentifiers || [];
      const isbnObj =
        identifiers.find((i) => i.type === "ISBN_13") ||
        identifiers.find((i) => i.type === "ISBN_10");
      const isbn = isbnObj ? isbnObj.identifier : "0000000000000";

      const cover =
        (info.imageLinks && (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)) ||
        (isbn !== "0000000000000"
          ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
          : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600");

      return {
        id: item.id,
        title: info.title || "Untitled",
        author: (info.authors && info.authors[0]) || "Unknown Author",
        isbn: isbn,
        pages: info.pageCount || 300,
        genre: (info.categories && info.categories[0]) || "General Fiction",
        rating: info.averageRating || 4.1,
        cover: cover.replace("http://", "https://"),
        blurb: info.description || "Every story opens a different door. Add this book to your reading journey and discover where its pages take you.",
        publicationYear: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : 2020,
        country: "International",
        pace: "Medium",
        moods: ["Thought-provoking", "Something new"],
        source: "googlebooks",
      };
    });
  } catch (error) {
    console.error("Google Books error:", error.message);
    return [];
  }
}

async function searchBooks(query) {
  // First try Google Books, then fall back to Open Library or combine
  const [googleResults, openLibraryResults] = await Promise.allSettled([
    searchGoogleBooks(query, 12),
    searchOpenLibrary(query, 12),
  ]);

  const results = [];
  const seenTitles = new Set();

  if (googleResults.status === "fulfilled" && googleResults.value) {
    for (const book of googleResults.value) {
      const key = book.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        results.push(book);
      }
    }
  }

  if (openLibraryResults.status === "fulfilled" && openLibraryResults.value) {
    for (const book of openLibraryResults.value) {
      const key = book.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        results.push(book);
      }
    }
  }

  return results;
}

module.exports = {
  searchBooks,
  searchGoogleBooks,
  searchOpenLibrary,
};
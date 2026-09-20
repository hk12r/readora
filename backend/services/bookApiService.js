async function searchBooks(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}&limit=20`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("External book API request failed");
  }

  const data = await response.json();

  return data.docs.map((book) => ({
    title: book.title || "Unknown",
    author: book.author_name?.[0] || "Unknown",
    isbn: book.isbn?.[0] || null,
    pageCount: book.number_of_pages_median || null,
    genres: book.subject?.slice(0, 5) || [],
  }));
}

module.exports = { searchBooks };
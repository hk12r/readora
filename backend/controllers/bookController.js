const Book = require("../models/Book");
const initialBooks = require("../data/seedData");

// Auto-seed books on startup if collection is empty or has fewer books
const seedDatabaseIfNeeded = async () => {
  try {
    const count = await Book.countDocuments();
    if (count < 20) {
      console.log(`Seeding database with ${initialBooks.length} curated Readora books...`);
      for (const b of initialBooks) {
        await Book.findOneAndUpdate(
          { isbn: b.isbn },
          { $set: b },
          { upsert: true, new: true }
        );
      }
      console.log("Database seeded successfully with curated books.");
    }
  } catch (err) {
    console.warn("Could not seed database:", err.message);
  }
};

// GET all books with extensive filters
const getBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      genre,
      mood,
      pace,
      minLength,
      maxLength,
      isFiction,
      country,
      search,
      sortBy = "rating",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { genre: { $regex: search, $options: "i" } },
      ];
    }

    if (genre && genre !== "All") {
      query.genre = { $regex: new RegExp(`^${genre}$`, "i") };
    }

    if (mood && mood !== "All") {
      query.moods = { $in: [mood] };
    }

    if (pace && pace !== "All") {
      query.pace = pace;
    }

    if (country && country !== "All") {
      query.country = country;
    }

    if (isFiction !== undefined && isFiction !== "") {
      query.isFiction = isFiction === "true";
    }

    if (minLength || maxLength) {
      query.pages = {};
      if (minLength) query.pages.$gte = parseInt(minLength);
      if (maxLength) query.pages.$lte = parseInt(maxLength);
    }

    const sortOptions = {};
    if (sortBy === "rating") sortOptions.rating = -1;
    else if (sortBy === "title") sortOptions.title = 1;
    else if (sortBy === "newest") sortOptions.publicationYear = -1;
    else if (sortBy === "pages") sortOptions.pages = 1;
    else sortOptions.rating = -1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await Book.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalBooks = await Book.countDocuments(query);

    res.json({
      page: pageNum,
      limit: limitNum,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limitNum),
      books,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single book by ID or ISBN
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    let book = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ isbn: id });
    }

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST a new book (Admin or catalog auto-add)
const createBook = async (req, res) => {
  try {
    const existing = await Book.findOne({ isbn: req.body.isbn });
    if (existing) {
      return res.status(200).json(existing);
    }

    const book = new Book(req.body);
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT - update a book
const updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE - delete a book
const deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({
      message: "Book deleted successfully",
      book: deletedBook,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST trigger manual seed
const seedBooks = async (req, res) => {
  try {
    let seededCount = 0;
    for (const b of initialBooks) {
      await Book.findOneAndUpdate(
        { isbn: b.isbn },
        { $set: b },
        { upsert: true, new: true }
      );
      seededCount++;
    }
    res.json({ message: `Successfully seeded ${seededCount} books.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  seedBooks,
  seedDatabaseIfNeeded,
};
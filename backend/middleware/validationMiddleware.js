const validateBook = (req, res, next) => {
  const { title, author, isbn, genre, pages } = req.body;

  if (!title || !author || !isbn || !genre || pages === undefined) {
    return res.status(400).json({
      message: "Title, author, ISBN, genre and pages are required",
    });
  }

  if (pages <= 0) {
    return res.status(400).json({
      message: "Pages must be greater than 0",
    });
  }

  next();
};

module.exports = {
  validateBook,
};
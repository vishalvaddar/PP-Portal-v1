const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: "File upload error",
      error: err.message
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
};

module.exports = errorHandler;
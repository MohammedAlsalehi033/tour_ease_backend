const addingSignedUrl = (req, res, next) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  // Assuming the file is an image and you want to generate a signed URL for it
  const signedUrl = `https://your-bucket.s3.amazonaws.com/${file.filename}?AWSAccessKeyId=YOUR_ACCESS_KEY&Expires=EXPIRATION_TIME&Signature=SIGNATURE`;

  // Attach the signed URL to the request object
  req.signedUrl = signedUrl;

  next();
}
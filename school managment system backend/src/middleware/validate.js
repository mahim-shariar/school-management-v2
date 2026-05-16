/**
 * validate(schema) — Joi request body validation middleware.
 * Strips unknown fields and returns 400 on validation failure.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.reduce((acc, d) => {
      const key = d.path.join(".");
      acc[key] = d.message.replace(/['"]/g, "");
      return acc;
    }, {});
    return res.status(400).json({ error: "Validation failed.", details: messages });
  }
  req.body = value;
  next();
};

module.exports = validate;

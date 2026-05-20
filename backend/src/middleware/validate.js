/**
 * Zod validation middleware for Express.
 *
 * Usage in routes:
 *   const { registerSchema } = require('../validators/authSchemas');
 *   const validate = require('../middleware/validate');
 *
 *   router.post('/register', validate(registerSchema), authController.register);
 *
 * How it works:
 *   1. Takes a Zod schema as argument
 *   2. Returns Express middleware that validates req.body
 *   3. On success: attaches cleaned data to req.validated and calls next()
 *   4. On failure: returns 400 with formatted error messages
 */

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors into a clean response
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        error: 'Validation Error',
        details: errors,
      });
    }

    // Attach the validated + transformed data (trimmed, lowercased, etc.)
    req.validated = result.data;
    next();
  };
}

module.exports = validate;

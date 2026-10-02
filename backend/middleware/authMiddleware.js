const jwt = require("jsonwebtoken");


const authMiddleware = (req, res, next) => {

    try {

        // Get Authorization header
        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({
                message: "Authorization token required"
            });

        }


        // Expected:
        // Bearer TOKEN

        const parts =
            authHeader.split(" ");


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({
                message: "Invalid authorization format"
            });

        }


        const token = parts[1];


        // Verify token
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // Store user information
        req.user = decoded;


        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }

};


module.exports = authMiddleware;
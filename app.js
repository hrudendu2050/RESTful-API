import express from "express";

const app= new express();
const PORT= 5100;

//--- 1. Demo Data
let users= [
    {
        id: 1,
        firstName: "Anshika",
        lastName: "Agarwal",
        hobby: "Teaching"
        },
        {
            id: 2,
            firstName: "Hrudendu",
            lastName: "Panigrahi",
            hobby: "Singing"
        }
        
];
let nextId= users.length+1;

// --- 2. Request Logging Middleware ---
const requestLogger = (req, res, next) => {
    // Log Request Details (Method and URL)
    console.log(`[${new Date().toLocaleString()}] Incoming Request: ${req.method} ${req.url}`);

    // Store a reference to the original res.send function
    const originalSend = res.send; 

    // Override res.send/res.end to capture the status code before sending the response
    res.send = function (body) {
        //  2. Log Response Details (Status Code)
        console.log(`[${new Date().toLocaleTimeString()}] Response Sent: ${req.method} ${req.url} -> Status ${res.statusCode}`);
        
        // Call the original function to complete the response
        originalSend.call(this, body); 
    };

    next();
};


// --- 3. Global Middleware ---
app.use(express.json());
// ➡️ Apply the custom logger globally
app.use(requestLogger);


// --- 4. Custom Validation Middleware ---
const validateUser = (req, res, next) => {
    const { firstName, lastName , hobby } = req.body;
    if (!firstName || !lastName || !hobby) {
        const error = new Error('Full Name and hobby are required fields.');
        error.status = 400;
        return next(error);
    }
    next();
};

// --- 5. Routing ---

// GET /users - Get all users
app.get('/users', (req, res) => {
    res.status(200).json(users);
});

// GET /users/:id - Get a specific user by ID
app.get('/users/:id', (req, res, next) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
        const error = new Error(`User with ID ${id} not found.`);
        error.status = 404;
        return next(error);
    }
    res.status(200).json(user);
});

// POST /users - Create a new user
app.post('/users', validateUser, (req, res) => {

    const {firstName, lastName, hobby} = req.body;
    const newUser = {
        id: nextId,
        firstName: firstName,
        lastName: lastName,
        hobby: hobby,
    };
    users.push(newUser);
    res.status(201).json(newUser);
});

// PUT /users/:id - Update an existing user
app.put('/users/:id', (req, res, next) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);
    const { firstName, lastName, hobby } = req.body;

    if (!userIndex) {
        const error = new Error(`User with ID ${id} not found.`);
        error.status = 404;
        return next(error);
    }

    // 1. Check if the body is completely empty (no fields to update)
    if (!firstName && !lastName && !hobby) {
        const error = new Error('At least one field is required for update.');
        error.status = 400;
        return next(error);
    }
    
    // 2. Perform the partial update
    const user = users[userIndex];
    
    if (firstName) {
        user.firstName = firstName;
    }
    else if (lastName) {
        user.lastName = lastName;
    }
    else if(hobby) {
        user.hobby = hobby;
    }


    // Update the array with the modified object (though 'user' is a reference,
    users[userIndex] = user;

    // 200 OK
    res.status(200).json(users[userIndex]);
});

// DELETE /users/:id - Delete a user
app.delete('/users/:id', (req, res, next) => {
    const id = parseInt(req.params.id);
    const initialLength = users.length;
    
    users = users.filter(u => u.id !== id);

    if (users.length === initialLength) {
        const error = new Error(`User with ID ${id} not found.`);
        error.status = 404;
        return next(error);
    }
    res.status(204).send();
});


// --- 6. Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // The logger will capture this status code (e.g., 404, 400)
    res.status(status).json({
        error: {
            status: status,
            message: message
        }
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
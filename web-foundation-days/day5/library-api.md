
# Library API Design

## Endpoints

### 1. List all books
- **Method:** GET
- **Path:** `/books`
- **Description:** Retrieves a list of all books in the library.
- **Success Status Code:** 200 OK

### 2. Get one book
- **Method:** GET
- **Path:** `/books/:id`
- **Description:** Retrieves the details of a specific book by its ID.
- **Success Status Code:** 200 OK

### 3. Create a new book
- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example Request Body:** 
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "year": 1925
  }
# Property Management System

A MERN stack application for managing property units, tracking occupancy status, and maintaining company-specific property records.

## Features

- Dashboard with total, vacant, and occupied unit summaries.
- Add and edit property unit details.
- Search units by unit number.
- Filter units by status: All, Vacant, and Occupied.
- Company-wise data isolation using `companyId`.
- Company-specific unit limits.
- Validation for required fields and non-negative annual rent.
- Duplicate unit prevention within the same company.
- Error handling for failed requests and invalid submissions.

## Technology Stack

**Frontend**
- React
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

## Project Structure

```text
property-management/
├── client/
│   └── src/
│       ├── App.jsx
│       └── App.css
├── server/
│   ├── models/
│   │   └── Property.js
│   ├── routes/
│   │   └── propertyRoutes.js
│   ├── .env
│   └── package.json
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Atlas account or another supported MongoDB instance
- Visual Studio Code (recommended)

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Misbahkhanum489/property-management.git
cd property-management
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder and configure your MongoDB connection:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Use your own MongoDB connection string. Do not commit database credentials to GitHub.

### 3. Start the backend

From the `server` folder, run:

```bash
npm run dev
```

The backend should run at:

`http://localhost:5000`

### 4. Start the frontend

Open a second terminal in the project root and run:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

`http://localhost:5173`

Keep both servers running while using the application.

## API Endpoints

Base URL:

`http://localhost:5000/api/properties`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/properties?companyId=company001` | Retrieve units for a company |
| POST | `/api/properties` | Add a property unit |
| PUT | `/api/properties/:id` | Update a property unit |

## Sample JSON Payloads

### 1. Add a property unit

Send a `POST` request to `/api/properties` with the following JSON body:

```json
{
  "companyId": "company001",
  "propertyName": "Green Valley",
  "buildingNumber": "B-01",
  "unitNumber": "A-101",
  "tenantName": "Sample Tenant",
  "tenantContact": "9876543210",
  "annualRent": 120000,
  "status": "Occupied"
}
```

### 2. Test negative annual rent

Change `annualRent` to `-5000`. The server should reject the invalid value.

```json
{
  "companyId": "company001",
  "propertyName": "Green Valley",
  "buildingNumber": "B-01",
  "unitNumber": "TEST-901",
  "annualRent": -5000,
  "status": "Vacant"
}
```

### 3. Test a blank unit number

Set `unitNumber` to an empty string. The server should reject the request.

```json
{
  "companyId": "company001",
  "propertyName": "Green Valley",
  "buildingNumber": "B-01",
  "unitNumber": "",
  "annualRent": 12000,
  "status": "Vacant"
}
```

### 4. Retrieve units for a company

Example request:

```text
GET http://localhost:5000/api/properties?companyId=company001
```

The response should contain only the units associated with `company001`.

## Validation and Error Handling

- Property name and unit number are required.
- Annual rent must be a valid, non-negative number.
- Duplicate unit numbers are prevented within the same company.
- Different companies can use the same unit number if the database's compound unique index is configured accordingly.
- API errors are returned to the frontend for display.
- Company-specific unit limits are enforced according to the application's configuration.

## Assumptions

1. Each property unit belongs to one company, identified by `companyId`.
2. Company IDs are `company001`, `company002`, and `company003` in the current configuration.
3. Unit numbers must be unique within each company, but may be reused by another company.
4. Annual rent is stored as a non-negative numeric value.
5. Unit status is Vacant or Occupied in the user interface.
6. The application uses a local frontend and backend during development.
7. MongoDB connection details are configured using environment variables.
8. Company IDs are used to scope the displayed data; production applications should also implement authentication and authorization to prevent users from accessing another company's records.

## Future Improvements

- User authentication and role-based access.
- Improved reporting and analytics.
- Automated tests for validation and company isolation.
- Production deployment.

## Repository

GitHub: https://github.com/Misbahkhanum489/property-management

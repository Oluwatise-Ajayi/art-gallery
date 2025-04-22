# Virtual Art Gallery API

Backend RESTful API for a Virtual Art Gallery platform, built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: Register, login, password reset via JWT
- **Artwork Management**: Create, update, delete, and view artworks
- **Gallery & Exhibition**: Virtual galleries and exhibitions
- **Image Upload**: Cloud storage integration (Cloudinary)
- **Search & Filtering**: Advanced search with filtering, sorting, and pagination
- **E-commerce**: Payment processing with Stripe
- **User Engagement**: Likes, favorites, and comments

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Payment Processing**: Stripe
- **Email Service**: Nodemailer
- **Validation**: Express Validator
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- Cloudinary account (for image uploads)
- Stripe account (for payments)
- SMTP service (for emails)

### Installation

1. Clone the repository:
   ```
   git clone  https://github.com/Oluwatise-Ajayi/art-gallery.git 
   cd virtual-art-gallery/Server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the Server directory (see `.env.example` for required variables)

4. Start the development server:
   ```
   npm run dev
   ```

### Running with Docker

1. Build the Docker image:
   ```
   docker build -t art-gallery-api .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 --env-file .env art-gallery-api
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /users/forgotPassword` - Request password reset
- `PATCH /users/resetPassword/:token` - Reset password

### Artwork Endpoints
- `GET /artworks` - Get all artworks
- `GET /artworks/:id` - Get artwork by ID
- `POST /artworks` - Create artwork (auth required)
- `PATCH /artworks/:id` - Update artwork (auth required)
- `DELETE /artworks/:id` - Delete artwork (auth required)

### User Endpoints
- `GET /users/me` - Get current user profile
- `PATCH /users/updateMe` - Update profile
- `PATCH /users/updateMyPassword` - Update password
- `DELETE /users/deleteMe` - Deactivate account

### Payment Endpoints
- `POST /orders/checkout-session/:artworkId` - Create payment session
- `GET /orders/my-orders` - Get user's orders

## Testing

```
npm test          # Run all tests
npm run test:unit # Run unit tests
npm run test:int  # Run integration tests
```

## Deployment

The API is designed to be deployed to any Node.js hosting service:

- Set `NODE_ENV=production`
- Ensure all environment variables are configured
- Run `npm start`


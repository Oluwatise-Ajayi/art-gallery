const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../app');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

let mongoServer;

// Create a token for testing protected routes
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

describe('User Controller', () => {
  let testUser;
  let authToken;
  
  beforeAll(async () => {
    // Start an in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });
  
  afterAll(async () => {
    // Disconnect and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // Clear the database before each test
    await User.deleteMany({});
    
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
      role: 'viewer'
    });
    
    // Create auth token for the user
    authToken = createToken(testUser._id);
  });
  
  describe('GET /api/v1/users/me', () => {
    it('should return the current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('name', 'Test User');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });
    
    it('should return 401 if no token is provided', async () => {
      await request(app)
        .get('/api/v1/users/me')
        .expect(401);
    });
  });
  
  describe('PATCH /api/v1/users/updateMe', () => {
    it('should update the current user profile', async () => {
      const response = await request(app)
        .patch('/api/v1/users/updateMe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          bio: 'This is my updated bio'
        })
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('name', 'Updated Name');
      expect(response.body.data.user).toHaveProperty('bio', 'This is my updated bio');
    });
    
    it('should not update password fields with this route', async () => {
      const response = await request(app)
        .patch('/api/v1/users/updateMe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        })
        .expect(400);
      
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('DELETE /api/v1/users/deleteMe', () => {
    it('should deactivate the current user account', async () => {
      await request(app)
        .delete('/api/v1/users/deleteMe')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
      
      // Check that the user is marked as inactive
      const user = await User.findById(testUser._id).select('+active');
      expect(user.active).toBe(false);
    });
  });
  
  describe('PATCH /api/v1/users/updateMyPassword', () => {
    it('should update the current user password', async () => {
      const response = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          passwordCurrent: 'password123',
          password: 'newpassword456',
          passwordConfirm: 'newpassword456'
        })
        .expect(200);
      
      expect(response.body.status).toBe('success');
      
      // Try logging in with the new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword456'
        })
        .expect(200);
      
      expect(loginResponse.body.status).toBe('success');
      expect(loginResponse.body).toHaveProperty('token');
    });
    
    it('should return 401 if current password is incorrect', async () => {
      const response = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          passwordCurrent: 'wrongpassword',
          password: 'newpassword456',
          passwordConfirm: 'newpassword456'
        })
        .expect(401);
      
      expect(response.body.status).toBe('error');
    });
  });
}); 
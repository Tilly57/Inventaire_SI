/**
 * Integration Tests for Auth API
 *
 * Tests for authentication endpoints
 */

import { describe, test, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth.routes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { cleanDatabase, disconnectDatabase, createTestUser } from '../utils/testUtils.js';

let app;

beforeAll(() => {
  // Create Express app with auth routes
  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
});

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe('newuser@example.com');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.accessToken).toBeDefined();
    // refreshToken is in cookie, not response body
  });

  test('should set cookies on registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'].length).toBeGreaterThan(0);

    const cookies = response.headers['set-cookie'];
    const hasRefreshToken = cookies.some(cookie => cookie.includes('refreshToken'));

    // Only refreshToken is set as httpOnly cookie for security
    expect(hasRefreshToken).toBe(true);
  });

  test('should return 409 if email already exists', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    // Create first user
    await request(app).post('/api/auth/register').send(userData);

    // Try to create duplicate
    const response = await request(app).post('/api/auth/register').send(userData);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('existe déjà');
  });

  test('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        // Missing password and names
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should make first user ADMIN', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'first@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('ADMIN');
  });

  test('should make second user GESTIONNAIRE by default', async () => {
    // Create first user (ADMIN)
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'first@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User',
      });

    // Create second user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'second@example.com',
        password: 'password123',
        firstName: 'Second',
        lastName: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('GESTIONNAIRE');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should login with correct credentials', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    // Register user first
    await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

    // Login
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.accessToken).toBeDefined();
    // refreshToken is in cookie, not response body
  });

  test('should set cookies on login', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();

    const cookies = response.headers['set-cookie'];
    const hasRefreshToken = cookies.some(cookie => cookie.includes('refreshToken'));

    // Only refreshToken is set as httpOnly cookie for security
    expect(hasRefreshToken).toBe(true);
  });

  test('should return 401 with wrong password', async () => {
    const email = 'test@example.com';

    await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'correct-password',
        firstName: 'Test',
        lastName: 'User',
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('incorrect');
  });

  test('should return 401 with non-existent email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('incorrect');
  });

  test('should return 400 for invalid request body', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        // Missing email and password
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should logout and clear cookies', async () => {
    // Register and login first
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    const cookies = loginResponse.headers['set-cookie'];

    // Logout
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toContain('Déconnexion réussie');

    // Check cookies are cleared
    const logoutCookies = response.headers['set-cookie'];
    expect(logoutCookies).toBeDefined();
  });
});

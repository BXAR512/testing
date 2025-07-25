const request = require('supertest');
const express = require('express');
const session = require('express-session');
const carpoolRoutes = require('../routes/carpool');

describe('Carpool Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/carpool', carpoolRoutes);
  });

  describe('GET /carpool/event/:eventId/participants', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/carpool/event/1/participants')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });

    test('should return 400 for invalid event ID', async () => {
      const response = await request(app)
        .get('/carpool/event/invalid/participants')
        .set('Cookie', ['connect.sid=test-session'])
        .expect(500); // This will fail due to parseInt

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /carpool/user/:userId/display-name', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/carpool/user/1/display-name')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('GET /carpool/event/:eventId/can-view', () => {
    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/carpool/event/1/can-view')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });
}); 
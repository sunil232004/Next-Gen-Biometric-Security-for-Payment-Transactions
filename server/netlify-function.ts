import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import app from './index';
import { Request, Response } from 'express';

// Convert Express app to Netlify Function
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Convert Netlify event to Express request
  const request = {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    query: event.queryStringParameters || {},
    body: event.body ? JSON.parse(event.body) : {},
  } as Request;

  // Create response object
  let statusCode = 200;
  let headers = {};
  let body = '';

  // Mock Express response
  const response = {
    status: (code: number) => {
      statusCode = code;
      return response;
    },
    json: (data: any) => {
      body = JSON.stringify(data);
      return response;
    },
    setHeader: (name: string, value: string) => {
      headers = { ...headers, [name]: value };
    },
  } as Response;

  try {
    // Handle the request
    await new Promise((resolve, reject) => {
      app(request, response, (err: any) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}; 
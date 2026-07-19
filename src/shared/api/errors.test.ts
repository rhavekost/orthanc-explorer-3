import { describe, it, expect } from 'vitest';
import {
  ApiError,
  AuthError,
  DicomError,
  isApiError,
  NetworkError,
  NotFoundError,
} from '@/shared/api/errors';

describe('ApiError', () => {
  it('stores the message, statusCode, code, and details', () => {
    const details = { reason: 'Invalid input' };
    const err = new ApiError('Request failed', 400, 'BAD_REQUEST', details);

    expect(err.message).toBe('Request failed');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.details).toEqual(details);
  });

  it('sets err.name to ApiError', () => {
    const err = new ApiError('Request failed', 400, 'BAD_REQUEST');

    expect(err.name).toBe('ApiError');
  });

  it('is an instance of Error', () => {
    const err = new ApiError('Request failed', 400, 'BAD_REQUEST');

    expect(err).toBeInstanceOf(Error);
  });
});

describe('NetworkError', () => {
  it('uses the default network error values', () => {
    const err = new NetworkError();

    expect(err.message).toBe('Network request failed');
    expect(err.statusCode).toBe(0);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.name).toBe('NetworkError');
  });

  it('passes through a custom message and details', () => {
    const details = { retryable: true };
    const err = new NetworkError('Connection timed out', details);

    expect(err.message).toBe('Connection timed out');
    expect(err.details).toEqual(details);
  });

  it('is an instance of ApiError', () => {
    const err = new NetworkError();

    expect(err).toBeInstanceOf(ApiError);
  });
});

describe('AuthError', () => {
  it('uses the default auth error values', () => {
    const err = new AuthError();

    expect(err.message).toBe('Authentication required');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_ERROR');
    expect(err.name).toBe('AuthError');
  });

  it('respects a custom statusCode', () => {
    const err = new AuthError('Forbidden', 403);

    expect(err.message).toBe('Forbidden');
    expect(err.statusCode).toBe(403);
  });
});

describe('NotFoundError', () => {
  it('stores the formatted message and resource details', () => {
    const resource = 'Study';
    const id = 'study-1';
    const err = new NotFoundError(resource, id);

    expect(err.message).toBe(`${resource} not found: ${id}`);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.details).toEqual({ resource, id });
    expect(err.name).toBe('NotFoundError');
  });
});

describe('DicomError', () => {
  it('stores the message and details with DICOM error values', () => {
    const details = { tag: 'PatientName' };
    const err = new DicomError('Invalid DICOM payload', details);

    expect(err.message).toBe('Invalid DICOM payload');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('DICOM_ERROR');
    expect(err.details).toEqual(details);
    expect(err.name).toBe('DicomError');
  });
});

describe('isApiError', () => {
  it('returns true for ApiError and subclass instances', () => {
    expect(isApiError(new ApiError('Request failed', 400, 'BAD_REQUEST'))).toBe(true);
    expect(isApiError(new NetworkError())).toBe(true);
    expect(isApiError(new AuthError())).toBe(true);
    expect(isApiError(new NotFoundError('Study', 'study-1'))).toBe(true);
    expect(isApiError(new DicomError('Invalid DICOM payload'))).toBe(true);
  });

  it('returns false for non-ApiError values', () => {
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError('string')).toBe(false);
  });
});

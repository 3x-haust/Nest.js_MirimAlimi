import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AuthService {
  constructor() {}

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    if (token === undefined) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true);

      return decodedToken;
    } catch (error) {
      throw new HttpException(
        {
          status: 401,
          timestamp: new Date().toISOString(),
          message: 'Invalid token',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      throw new HttpException(
        {
          status: 404,
          timestamp: new Date().toISOString(),
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async createCustomToken(uid: string): Promise<string> {
    if (uid === undefined) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const customToken = await admin.auth().createCustomToken(uid);

      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
        {
          token: customToken,
          returnSecureToken: true,
        },
      );

      return response.data.idToken;
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error creating custom token',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    if (uid === undefined || claims === undefined) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await admin.auth().setCustomUserClaims(uid, claims);
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error setting custom claims',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async setUserRole(uid: string, role: string): Promise<void> {
    if (uid === undefined || role === undefined) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await admin.firestore().collection('users').doc(uid).update({ role });
      await this.setCustomUserClaims(uid, { role });
      await this.revokeRefreshTokens(uid);
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error setting user role',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserRole(uid: string): Promise<string | null> {
    if (uid === undefined) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .get();
      return userDoc.exists ? userDoc.data().role : null;
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error getting user role',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    if (uid === undefined) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await admin.auth().revokeRefreshTokens(uid);
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error revoking refresh tokens',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUser(
    email: string,
    name: string,
    role: string,
    classRef: admin.firestore.DocumentReference,
  ): Promise<string> {
    if (
      email === undefined ||
      name === undefined ||
      role === undefined ||
      classRef === undefined
    ) {
      throw new HttpException(
        {
          status: 400,
          timestamp: new Date().toISOString(),
          message: 'Invalid input data',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        displayName: name,
      });

      await admin.firestore().collection('users').doc(userRecord.uid).set({
        email,
        name,
        role,
        class: classRef,
      });

      await this.setCustomUserClaims(userRecord.uid, { role });
      await this.revokeRefreshTokens(userRecord.uid);

      return userRecord.uid;
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error creating user',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export default AuthService;

import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AuthService {
  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true);

      const user = await this.getUserByUid(decodedToken.uid);
      if (
        decodedToken.auth_time * 1000 <
        new Date(user.tokensValidAfterTime).getTime()
      ) {
        throw new Error('Token is outdated. Please re-authenticate.');
      }

      return decodedToken;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      throw new Error('User not found');
    }
  }

  async createCustomToken(uid: string): Promise<string> {
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
      console.error('Error creating custom token:', error);
      throw new Error('Error creating custom token');
    }
  }

  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    try {
      await admin.auth().setCustomUserClaims(uid, claims);
    } catch (error) {
      throw new Error('Error setting custom claims');
    }
  }

  async setUserRole(uid: string, role: string): Promise<void> {
    try {
      await admin.firestore().collection('users').doc(uid).update({ role });
      await this.setCustomUserClaims(uid, { role });
      await this.revokeRefreshTokens(uid);
    } catch (error) {
      throw new Error('Error setting user role');
    }
  }

  async getUserRole(uid: string): Promise<string | null> {
    try {
      const userDoc = await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .get();
      return userDoc.exists ? userDoc.data().role : null;
    } catch (error) {
      throw new Error('Error getting user role');
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await admin.auth().revokeRefreshTokens(uid);
    } catch (error) {
      throw new Error('Error revoking refresh tokens');
    }
  }

  async createUser(
    email: string,
    name: string,
    role: string,
    classRef: admin.firestore.DocumentReference,
  ): Promise<string> {
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
      throw new Error('Error creating user');
    }
  }
}

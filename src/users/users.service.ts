import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(private authService: AuthService) {}

  async createUser(
    email: string,
    name: string,
    role: string,
    classId: string,
  ): Promise<string> {
    if (
      email === undefined ||
      name === undefined ||
      role === undefined ||
      classId === undefined
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
      const classRef = admin.firestore().collection('classes').doc(classId);
      return this.authService.createUser(email, name, role, classRef);
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

  async updateUser(
    uid: string,
    updateData: Partial<{
      email: string;
      name: string;
      role: string;
      classId: string;
    }>,
  ): Promise<void> {
    if (
      uid === undefined ||
      (updateData.email === undefined &&
        updateData.name === undefined &&
        updateData.role === undefined &&
        updateData.classId === undefined)
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
      const updateObj: any = {};
      if (updateData.email) updateObj.email = updateData.email;
      if (updateData.name) updateObj.name = updateData.name;
      if (updateData.role) updateObj.role = updateData.role;
      if (updateData.classId) {
        updateObj.class = admin
          .firestore()
          .collection('classes')
          .doc(updateData.classId);
      }

      await admin.firestore().collection('users').doc(uid).update(updateObj);

      if (updateData.role) {
        await this.authService.setUserRole(uid, updateData.role);
      }

      await this.authService.revokeRefreshTokens(uid);
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error updating user',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserByUid(uid: string): Promise<any> {
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

    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new HttpException(
        {
          status: 404,
          timestamp: new Date().toISOString(),
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const userData = userDoc.data();
      if (userData.class) {
        const classDoc = await userData.class.get();
        userData.class = classDoc.data();
      }
      return { id: userDoc.id, ...userData };
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error getting user',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const usersSnapshot = await admin.firestore().collection('users').get();
      return Promise.all(
        usersSnapshot.docs.map(async (doc) => {
          const userData = doc.data();
          if (userData.class) {
            const classDoc = await userData.class.get();
            userData.class = classDoc.data();
          }
          return { id: doc.id, ...userData };
        }),
      );
    } catch (error) {
      new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error getting users',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUser(uid: string): Promise<void> {
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
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection('users').doc(uid).delete();
    } catch (error) {
      throw new HttpException(
        {
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'Error deleting user',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

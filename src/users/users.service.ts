import { Injectable } from '@nestjs/common';
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
    const classRef = admin.firestore().collection('classes').doc(classId);
    return this.authService.createUser(email, name, role, classRef);
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
  }

  async getUserByUid(uid: string): Promise<any> {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();
    if (userData.class) {
      const classDoc = await userData.class.get();
      userData.class = classDoc.data();
    }
    return { id: userDoc.id, ...userData };
  }

  async getAllUsers(): Promise<any[]> {
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
  }

  async deleteUser(uid: string): Promise<void> {
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection('users').doc(uid).delete();
  }
}

import { test as base } from '@playwright/test';
import * as path from 'path';
import { testPaths } from '../config/env';
import { User } from '../utils/session/types';

type UserFixtures = {
  users: {
    Bob: User;
    Alice: User;
    Claire: User;
    MissAm: User;
  };
};

export const test = base.extend<UserFixtures>({
  users: async ({}, use) => {
    const users = {
      Bob: {
        userId: 10101,
        testUserName: 'Bob',
        videoPathOverride: path.join(testPaths.videos, '/predefinedUsers/foreman_qcif.y4m'),
      },
      Alice: {
        userId: 20202,
        testUserName: 'Alice',
        videoPathOverride: path.join(testPaths.videos, '/predefinedUsers/akiyo_qcif.y4m'),
      },
      Claire: {
        userId: 30303,
        testUserName: 'Claire',
        videoPathOverride: path.join(testPaths.videos, '/predefinedUsers/claire_qcif.y4m'),
      },
      MissAm: {
        userId: 40404,
        testUserName: 'MissAm',
        videoPathOverride: path.join(testPaths.videos, '/predefinedUsers/miss_am_qcif.y4m'),
      },
    };
    await use(users);
  },
});

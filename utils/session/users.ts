import { User } from './types';
import * as path from 'path';
import { testPaths } from '../../config/env';

export const Bob: User = {
  userId: 10101,
  testUserName: 'Bob',
  videoPathOverride: path.join(testPaths.videos, 'foreman_qcif.y4m'),
};

export const Alice: User = {
  userId: 20202,
  testUserName: 'Alice',
  videoPathOverride: path.join(testPaths.videos, 'akiyo_qcif.y4m'),
};

export const Claire: User = {
  userId: 30303,
  testUserName: 'Claire',
  videoPathOverride: path.join(testPaths.videos, 'claire_qcif.y4m'),
};

export const MissAm: User = {
  userId: 40404,
  testUserName: 'MissAm',
  videoPathOverride: path.join(testPaths.videos, 'miss_am_qcif.y4m'),
};

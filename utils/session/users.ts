import { User } from './types';
import * as path from 'path';
import { config } from '../../config/env';

export const Bob: User = {
  userId: 10101,
  testUserName: 'Bob',
  videoPathOverride: path.join(config.paths.videos, 'foreman_qcif.y4m'),
};

export const Alice: User = {
  userId: 20202,
  testUserName: 'Alice',
  videoPathOverride: path.join(config.paths.videos, 'akiyo_qcif.y4m'),
};

export const Claire: User = {
  userId: 30303,
  testUserName: 'Claire',
  videoPathOverride: path.join(config.paths.videos, 'claire_qcif.y4m'),
};

export const MissAm: User = {
  userId: 40404,
  testUserName: 'MissAm',
  videoPathOverride: path.join(config.paths.videos, 'miss_am_qcif.y4m'),
};

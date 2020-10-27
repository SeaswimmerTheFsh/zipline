import aes from 'crypto-js/aes';
import { compareSync, hashSync } from 'bcrypt';
import { Configuration } from './Config';
import { Connection } from 'typeorm';
import { Zipline } from '../entities/Zipline';

const config = Configuration.readConfig();

export function createRandomId(
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) {
  let result = '';
  for (let i = 0; i < length; i++)
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  return result;
}

export function createToken() {
  return aes
    .encrypt(`${createRandomId(10)}.${Date.now()}`, config.core.secret)
    .toString();
}

export function encryptPassword(pass: string) {
  return hashSync(pass, 10);
}

export function checkPassword(will: string, equal: string) {
  return compareSync(will, equal);
}

export function createBaseCookie(id: number) {
  return Buffer.from(id.toString()).toString('base64');
}

export function readBaseCookie(data) {
  return Buffer.from(data, 'base64').toString();
}

export async function getFirst(orm: Connection): Promise<boolean> {
  const zipline = orm.getRepository(Zipline);
  let d = await zipline.findOne({ id: 'zipline' });
  if (!d) d = await zipline.save(new Zipline());
  return d.first;
}

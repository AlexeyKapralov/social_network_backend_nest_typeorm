import * as bcrypt from 'bcrypt';

export class CryptoService {
    async createPasswordHash(password: string, salt?: string): Promise<string> {
        if (salt === undefined) {
            salt = await bcrypt.genSalt(10);
        }

        return await bcrypt.hash(password, salt);
    }

    async comparePasswordHash(
        password: string,
        dbHash: string,
    ): Promise<boolean> {
        return await bcrypt.compare(password, dbHash);
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnsForBan1737054672186 implements MigrationInterface {
    name = 'AddColumnsForBan1737054672186';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ADD "isBanned" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "banReason" character varying`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "banReason"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isBanned"`);
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBanBlacklistTable1737138423108 implements MigrationInterface {
    name = 'AddBanBlacklistTable1737138423108';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "blog_blacklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blogId" character varying NOT NULL, "userId" character varying NOT NULL, CONSTRAINT "PK_1a45c3a1be2dbfdc5e2666a711e" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "blog_blacklist"`);
    }
}

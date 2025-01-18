import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateToBlacklist1737178005290 implements MigrationInterface {
    name = 'AddDateToBlacklist1737178005290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD "banDate" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP COLUMN "banDate"`);
    }

}

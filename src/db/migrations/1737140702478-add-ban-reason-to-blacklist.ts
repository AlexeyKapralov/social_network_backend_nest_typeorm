import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanReasonToBlacklist1737140702478 implements MigrationInterface {
    name = 'AddBanReasonToBlacklist1737140702478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD "banReason" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP COLUMN "banReason"`);
    }

}

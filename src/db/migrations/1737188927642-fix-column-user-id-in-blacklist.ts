import { MigrationInterface, QueryRunner } from "typeorm";

export class FixColumnUserIdInBlacklist1737188927642 implements MigrationInterface {
    name = 'FixColumnUserIdInBlacklist1737188927642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ALTER COLUMN "userId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ALTER COLUMN "userId" SET NOT NULL`);
    }

}

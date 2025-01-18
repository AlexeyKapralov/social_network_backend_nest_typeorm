import { MigrationInterface, QueryRunner } from "typeorm";

export class FixBlogblacklistTableColumns1737147178556 implements MigrationInterface {
    name = 'FixBlogblacklistTableColumns1737147178556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD "blogId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD "userId" uuid NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD "userId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD "blogId" character varying NOT NULL`);
    }

}

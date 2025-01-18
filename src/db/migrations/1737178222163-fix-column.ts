import { MigrationInterface, QueryRunner } from "typeorm";

export class FixColumn1737178222163 implements MigrationInterface {
    name = 'FixColumn1737178222163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ALTER COLUMN "banDate" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ALTER COLUMN "banDate" DROP NOT NULL`);
    }

}

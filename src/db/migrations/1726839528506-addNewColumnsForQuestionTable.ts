import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewColumnsForQuestionTable1726839528506 implements MigrationInterface {
    name = 'AddNewColumnsForQuestionTable1726839528506'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" ADD "published" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "question" ADD "createdAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question" ADD "updatedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "question" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "published"`);
    }

}

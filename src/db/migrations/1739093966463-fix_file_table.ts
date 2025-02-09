import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFileTable1739093966463 implements MigrationInterface {
    name = 'FixFileTable1739093966463';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "post" DROP CONSTRAINT "FK_5e15d5c09884be054d56fd40fb7"`,
        );
        await queryRunner.query(
            `ALTER TABLE "blog" DROP CONSTRAINT "FK_477f28376a406f293c83b311692"`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" DROP CONSTRAINT "UQ_5e15d5c09884be054d56fd40fb7"`,
        );
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "fileId"`);
        await queryRunner.query(
            `ALTER TABLE "blog" DROP CONSTRAINT "UQ_477f28376a406f293c83b311692"`,
        );
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "fileId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" ADD "fileId" uuid`);
        await queryRunner.query(
            `ALTER TABLE "blog" ADD CONSTRAINT "UQ_477f28376a406f293c83b311692" UNIQUE ("fileId")`,
        );
        await queryRunner.query(`ALTER TABLE "post" ADD "fileId" uuid`);
        await queryRunner.query(
            `ALTER TABLE "post" ADD CONSTRAINT "UQ_5e15d5c09884be054d56fd40fb7" UNIQUE ("fileId")`,
        );
        await queryRunner.query(
            `ALTER TABLE "blog" ADD CONSTRAINT "FK_477f28376a406f293c83b311692" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" ADD CONSTRAINT "FK_5e15d5c09884be054d56fd40fb7" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}

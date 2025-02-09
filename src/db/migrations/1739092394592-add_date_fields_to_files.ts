import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateFieldsToFiles1739092394592 implements MigrationInterface {
    name = 'AddDateFieldsToFiles1739092394592';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "file" ADD "createdAt" TIMESTAMP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "file" ADD "deletedDate" TIMESTAMP`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "deletedDate"`);
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "createdAt"`);
    }
}

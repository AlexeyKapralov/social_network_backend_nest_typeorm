import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUrlForFilesTable1739350991728 implements MigrationInterface {
    name = 'AddUrlForFilesTable1739350991728';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "file" ADD "url" character varying NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "url"`);
    }
}

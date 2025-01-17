import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBanDate1737111898545 implements MigrationInterface {
    name = 'AddBanDate1737111898545';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "banDate" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "banDate"`);
    }
}

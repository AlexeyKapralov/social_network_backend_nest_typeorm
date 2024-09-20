import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStartedAtAndFinishedAtColumns1726835043429
    implements MigrationInterface
{
    name = 'AddStartedAtAndFinishedAtColumns1726835043429';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" ADD "startedAt" TIMESTAMP`);
        await queryRunner.query(
            `ALTER TABLE "game" ADD "finishedAt" TIMESTAMP`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "finishedAt"`);
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "startedAt"`);
    }
}

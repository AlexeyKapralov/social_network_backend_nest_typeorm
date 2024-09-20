import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameColumns1726760301860 implements MigrationInterface {
    name = 'RenameColumns1726760301860';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "player_1"`);
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "player_2"`);
        await queryRunner.query(
            `ALTER TABLE "game" ADD "player_1_id" uuid NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "game" ADD "player_2_id" uuid NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "player_2_id"`);
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "player_1_id"`);
        await queryRunner.query(
            `ALTER TABLE "game" ADD "player_2" uuid NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "game" ADD "player_1" uuid NOT NULL`,
        );
    }
}

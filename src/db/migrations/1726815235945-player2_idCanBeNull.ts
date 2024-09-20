import { MigrationInterface, QueryRunner } from 'typeorm';

export class Player2IdCanBeNull1726815235945 implements MigrationInterface {
    name = 'Player2IdCanBeNull1726815235945';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "game" ALTER COLUMN "player_2_id" DROP NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "game" ALTER COLUMN "player_2_id" SET NOT NULL`,
        );
    }
}

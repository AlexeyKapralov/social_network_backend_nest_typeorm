import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFileTable21739098262670 implements MigrationInterface {
    name = 'FixFileTable21739098262670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" RENAME COLUMN "weight" TO "width"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" RENAME COLUMN "width" TO "weight"`);
    }

}

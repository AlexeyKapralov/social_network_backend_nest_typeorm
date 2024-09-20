import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJoinColumn1726824833681 implements MigrationInterface {
    name = 'AddJoinColumn1726824833681';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "player" ADD "gameId" uuid`);
        await queryRunner.query(
            `ALTER TABLE "player" ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "player" DROP CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a"`,
        );
        await queryRunner.query(`ALTER TABLE "player" DROP COLUMN "gameId"`);
    }
}

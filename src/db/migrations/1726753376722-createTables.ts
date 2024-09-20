import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1726753376722 implements MigrationInterface {
    name = 'CreateTables1726753376722';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "player" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" integer NOT NULL, "userId" uuid, CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" character varying COLLATE "C" NOT NULL, "answers" text NOT NULL, "gameQuestionsId" uuid, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "game_question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "index" integer NOT NULL, "gameId" uuid, "questionId" uuid, CONSTRAINT "PK_08867ba249fa9d179d5449d27d3" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "answer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying COLLATE "C" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "questionId" uuid, "playerId" uuid, "gameId" uuid, CONSTRAINT "PK_9232db17b63fb1e94f97e5c224f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying COLLATE "C" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "player_1" uuid NOT NULL, "player_2" uuid NOT NULL, CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "player" ADD CONSTRAINT "FK_7687919bf054bf262c669d3ae21" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "question" ADD CONSTRAINT "FK_cca2a32ccd53fdf6baccdfe8d14" FOREIGN KEY ("gameQuestionsId") REFERENCES "game_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" ADD CONSTRAINT "FK_d35bdfc9ff116d456dcad4a580e" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" ADD CONSTRAINT "FK_0040e663701d18ed9d1c49ecf6b" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "answer" ADD CONSTRAINT "FK_a4013f10cd6924793fbd5f0d637" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "answer" ADD CONSTRAINT "FK_5c486122f6925ef0e8fefd5fc75" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "answer" ADD CONSTRAINT "FK_cdf2cd157111cc483c57a95f3a6" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "answer" DROP CONSTRAINT "FK_cdf2cd157111cc483c57a95f3a6"`,
        );
        await queryRunner.query(
            `ALTER TABLE "answer" DROP CONSTRAINT "FK_5c486122f6925ef0e8fefd5fc75"`,
        );
        await queryRunner.query(
            `ALTER TABLE "answer" DROP CONSTRAINT "FK_a4013f10cd6924793fbd5f0d637"`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" DROP CONSTRAINT "FK_0040e663701d18ed9d1c49ecf6b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" DROP CONSTRAINT "FK_d35bdfc9ff116d456dcad4a580e"`,
        );
        await queryRunner.query(
            `ALTER TABLE "question" DROP CONSTRAINT "FK_cca2a32ccd53fdf6baccdfe8d14"`,
        );
        await queryRunner.query(
            `ALTER TABLE "player" DROP CONSTRAINT "FK_7687919bf054bf262c669d3ae21"`,
        );
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "answer"`);
        await queryRunner.query(`DROP TABLE "game_question"`);
        await queryRunner.query(`DROP TABLE "question"`);
        await queryRunner.query(`DROP TABLE "player"`);
    }
}

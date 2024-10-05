import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabases1728122463818 implements MigrationInterface {
    name = 'AddDatabases1728122463818';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "login" character varying COLLATE "C" NOT NULL, "email" character varying COLLATE "C" NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "isDeleted" boolean NOT NULL DEFAULT false, "confirmationCode" character varying NOT NULL, "isConfirmed" boolean NOT NULL DEFAULT false, "confirmationCodeExpireDate" TIMESTAMP NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "player" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" integer NOT NULL, "userId" uuid, "gameId" uuid, CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "answer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying COLLATE "C" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "questionId" uuid, "playerId" uuid, "gameId" uuid, CONSTRAINT "PK_9232db17b63fb1e94f97e5c224f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying COLLATE "C" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE, "finishedAt" TIMESTAMP WITH TIME ZONE, "player_1_id" uuid NOT NULL, "player_2_id" uuid, CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "game_question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "index" integer NOT NULL, "gameId" uuid, "questionId" uuid, CONSTRAINT "PK_08867ba249fa9d179d5449d27d3" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" character varying COLLATE "C" NOT NULL, "answers" text NOT NULL, "published" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE, "gameQuestionsId" uuid, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "blog" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying COLLATE "C" NOT NULL, "description" character varying COLLATE "C" NOT NULL, "websiteUrl" character varying COLLATE "C" NOT NULL, "createdAt" TIMESTAMP NOT NULL, "isMembership" boolean NOT NULL DEFAULT true, "deletedDate" TIMESTAMP, CONSTRAINT "PK_85c6532ad065a448e9de7638571" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL, "likeStatus" character varying NOT NULL, "deletedDate" TIMESTAMP, "parentId" uuid, "userId" uuid, "commentId" uuid, CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "post" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying COLLATE "C" NOT NULL, "shortDescription" character varying COLLATE "C" NOT NULL, "content" character varying COLLATE "C" NOT NULL, "createdAt" character varying NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', "dislikesCount" integer NOT NULL DEFAULT '0', "deletedDate" TIMESTAMP, "blogId" uuid, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying COLLATE "C" NOT NULL, "createdAt" character varying NOT NULL, "likesCount" integer NOT NULL, "dislikesCount" integer NOT NULL, "isDeleted" boolean NOT NULL, "deletedDate" TIMESTAMP, "userId" uuid, "postId" uuid, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "device" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "deviceName" character varying NOT NULL, "ip" character varying NOT NULL, "iat" TIMESTAMP NOT NULL, "exp" TIMESTAMP NOT NULL, CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "player" ADD CONSTRAINT "FK_7687919bf054bf262c669d3ae21" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "player" ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
        await queryRunner.query(
            `ALTER TABLE "game_question" ADD CONSTRAINT "FK_d35bdfc9ff116d456dcad4a580e" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" ADD CONSTRAINT "FK_0040e663701d18ed9d1c49ecf6b" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "question" ADD CONSTRAINT "FK_cca2a32ccd53fdf6baccdfe8d14" FOREIGN KEY ("gameQuestionsId") REFERENCES "game_question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" ADD CONSTRAINT "FK_3908911ec5e661646008cb03474" FOREIGN KEY ("parentId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" ADD CONSTRAINT "FK_d86e0a3eeecc21faa0da415a18a" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" ADD CONSTRAINT "FK_d0418ddc42c5707dbc37b05bef9" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "comment" ADD CONSTRAINT "FK_c0354a9a009d3bb45a08655ce3b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "comment" ADD CONSTRAINT "FK_94a85bb16d24033a2afdd5df060" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "comment" DROP CONSTRAINT "FK_94a85bb16d24033a2afdd5df060"`,
        );
        await queryRunner.query(
            `ALTER TABLE "comment" DROP CONSTRAINT "FK_c0354a9a009d3bb45a08655ce3b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" DROP CONSTRAINT "FK_d0418ddc42c5707dbc37b05bef9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" DROP CONSTRAINT "FK_d86e0a3eeecc21faa0da415a18a"`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" DROP CONSTRAINT "FK_3908911ec5e661646008cb03474"`,
        );
        await queryRunner.query(
            `ALTER TABLE "question" DROP CONSTRAINT "FK_cca2a32ccd53fdf6baccdfe8d14"`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" DROP CONSTRAINT "FK_0040e663701d18ed9d1c49ecf6b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "game_question" DROP CONSTRAINT "FK_d35bdfc9ff116d456dcad4a580e"`,
        );
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
            `ALTER TABLE "player" DROP CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a"`,
        );
        await queryRunner.query(
            `ALTER TABLE "player" DROP CONSTRAINT "FK_7687919bf054bf262c669d3ae21"`,
        );
        await queryRunner.query(`DROP TABLE "device"`);
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "like"`);
        await queryRunner.query(`DROP TABLE "blog"`);
        await queryRunner.query(`DROP TABLE "question"`);
        await queryRunner.query(`DROP TABLE "game_question"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "answer"`);
        await queryRunner.query(`DROP TABLE "player"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
}

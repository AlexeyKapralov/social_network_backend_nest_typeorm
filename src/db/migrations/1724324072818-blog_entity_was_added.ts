import { MigrationInterface, QueryRunner } from "typeorm";

export class BlogEntityWasAdded1724324072818 implements MigrationInterface {
    name = 'BlogEntityWasAdded1724324072818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "blog" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "websiteUrl" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "isMembership" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_85c6532ad065a448e9de7638571" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "blog"`);
    }

}

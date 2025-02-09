import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileTable1739089452501 implements MigrationInterface {
    name = 'AddFileTable1739089452501';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileSize" character varying NOT NULL, "height" character varying NOT NULL, "weight" character varying NOT NULL, "typeFile" character varying NOT NULL, "blogId" uuid, "postId" uuid, "fileKey" character varying NOT NULL, CONSTRAINT "REL_f5c2428a9d0324e378cb33abb6" UNIQUE ("blogId"), CONSTRAINT "REL_f0f2188b3e254ad31ba2b95ec4" UNIQUE ("postId"), CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`ALTER TABLE "post" ADD "fileId" uuid`);
        await queryRunner.query(
            `ALTER TABLE "post" ADD CONSTRAINT "UQ_5e15d5c09884be054d56fd40fb7" UNIQUE ("fileId")`,
        );
        await queryRunner.query(`ALTER TABLE "blog" ADD "fileId" uuid`);
        await queryRunner.query(
            `ALTER TABLE "blog" ADD CONSTRAINT "UQ_477f28376a406f293c83b311692" UNIQUE ("fileId")`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" ADD CONSTRAINT "FK_5e15d5c09884be054d56fd40fb7" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "file" ADD CONSTRAINT "FK_f5c2428a9d0324e378cb33abb68" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "file" ADD CONSTRAINT "FK_f0f2188b3e254ad31ba2b95ec4b" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "blog" ADD CONSTRAINT "FK_477f28376a406f293c83b311692" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "blog" DROP CONSTRAINT "FK_477f28376a406f293c83b311692"`,
        );
        await queryRunner.query(
            `ALTER TABLE "file" DROP CONSTRAINT "FK_f0f2188b3e254ad31ba2b95ec4b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "file" DROP CONSTRAINT "FK_f5c2428a9d0324e378cb33abb68"`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" DROP CONSTRAINT "FK_5e15d5c09884be054d56fd40fb7"`,
        );
        await queryRunner.query(
            `ALTER TABLE "blog" DROP CONSTRAINT "UQ_477f28376a406f293c83b311692"`,
        );
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "fileId"`);
        await queryRunner.query(
            `ALTER TABLE "post" DROP CONSTRAINT "UQ_5e15d5c09884be054d56fd40fb7"`,
        );
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "fileId"`);
        await queryRunner.query(`DROP TABLE "file"`);
    }
}

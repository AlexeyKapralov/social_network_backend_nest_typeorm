import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostAndLikeEntityWasCreated1724437099831
    implements MigrationInterface
{
    name = 'PostAndLikeEntityWasCreated1724437099831';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" character varying NOT NULL, "likeStatus" character varying NOT NULL, "deletedDate" TIMESTAMP, "parentId" uuid, CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "post" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "shortDescription" character varying NOT NULL, "content" character varying NOT NULL, "createdAt" character varying NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', "dislikesCount" integer NOT NULL DEFAULT '0', "deletedDate" TIMESTAMP, "blogId" uuid, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" ADD CONSTRAINT "FK_3908911ec5e661646008cb03474" FOREIGN KEY ("parentId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "post" ADD CONSTRAINT "FK_d0418ddc42c5707dbc37b05bef9" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "post" DROP CONSTRAINT "FK_d0418ddc42c5707dbc37b05bef9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "like" DROP CONSTRAINT "FK_3908911ec5e661646008cb03474"`,
        );
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "like"`);
    }
}

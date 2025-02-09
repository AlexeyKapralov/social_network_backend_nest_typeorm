import { MigrationInterface, QueryRunner } from "typeorm";

export class FixColumnsForFileTable1739103487085 implements MigrationInterface {
    name = 'FixColumnsForFileTable1739103487085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_f5c2428a9d0324e378cb33abb68"`);
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_f0f2188b3e254ad31ba2b95ec4b"`);
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "REL_f5c2428a9d0324e378cb33abb6"`);
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "REL_f0f2188b3e254ad31ba2b95ec4"`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_f5c2428a9d0324e378cb33abb68" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_f0f2188b3e254ad31ba2b95ec4b" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_f0f2188b3e254ad31ba2b95ec4b"`);
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_f5c2428a9d0324e378cb33abb68"`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "REL_f0f2188b3e254ad31ba2b95ec4" UNIQUE ("postId")`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "REL_f5c2428a9d0324e378cb33abb6" UNIQUE ("blogId")`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_f0f2188b3e254ad31ba2b95ec4b" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_f5c2428a9d0324e378cb33abb68" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

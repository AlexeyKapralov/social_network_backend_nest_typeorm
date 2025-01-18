import { MigrationInterface, QueryRunner } from "typeorm";

export class FixColumnInBlacklist1737223580353 implements MigrationInterface {
    name = 'FixColumnInBlacklist1737223580353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" ADD CONSTRAINT "FK_70678f4115eb472b9221e38c196" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_blacklist" DROP CONSTRAINT "FK_70678f4115eb472b9221e38c196"`);
    }

}

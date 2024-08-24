import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewRelationWasCreated1724443903019 implements MigrationInterface {
    name = 'NewRelationWasCreated1724443903019';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like" ADD "userId" uuid`);
        await queryRunner.query(
            `ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`,
        );
        await queryRunner.query(`ALTER TABLE "like" DROP COLUMN "userId"`);
    }
}

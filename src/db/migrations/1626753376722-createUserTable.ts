import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTables1626753376722 implements MigrationInterface {
    name = 'CreateUserTable1626753376722';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "login" character varying COLLATE "C" NOT NULL, "email" character varying COLLATE "C" NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, "isDeleted" boolean NOT NULL DEFAULT false, "confirmationCode" character varying NOT NULL, "isConfirmed" boolean NOT NULL DEFAULT false, "confirmationCodeExpireDate" TIMESTAMP NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }
}

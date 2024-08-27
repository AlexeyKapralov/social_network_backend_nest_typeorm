import { MigrationInterface, QueryRunner } from 'typeorm';

export class CollationForTextColumnsWasAdded1724681384924
    implements MigrationInterface
{
    name = 'CollationForTextColumnsWasAdded1724681384924';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "blog"
                ALTER COLUMN "name" SET DATA TYPE character varying(255) COLLATE "C",
                ALTER COLUMN "description" SET DATA TYPE character varying(255) COLLATE "C",
                ALTER COLUMN "websiteUrl" SET DATA TYPE character varying(255) COLLATE "C"`,
        );
        await queryRunner.query(
            `ALTER TABLE "post"
                ALTER COLUMN "title" SET DATA TYPE character varying(255) COLLATE "C",
                ALTER COLUMN "shortDescription" SET DATA TYPE character varying(255) COLLATE "C",
                ALTER COLUMN "content" SET DATA TYPE character varying(255) COLLATE "C"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "blog"
                ALTER COLUMN "name" SET DATA TYPE character varying(255),
                ALTER COLUMN "description" SET DATA TYPE character varying(255),
                ALTER COLUMN "websiteUrl" SET DATA TYPE character varying(255)`,
        );
        await queryRunner.query(
            `ALTER TABLE "post"
                ALTER COLUMN "title" SET DATA TYPE character varying(255),
                ALTER COLUMN "shortDescription" SET DATA TYPE character varying(255),
                ALTER COLUMN "content" SET DATA TYPE character varying(255)`,
        );
    }
}

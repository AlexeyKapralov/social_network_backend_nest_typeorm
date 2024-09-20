import { Injectable } from '@nestjs/common';
import { Game } from '../domain/game.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { GameStatuses } from '../api/dto/output/game-pair-view.dto';
import { Player } from '../domain/player.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class QuizRepository {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        @InjectRepository(Game) private gameRepo: Repository<Game>,
        @InjectRepository(Player) private playerRepo: Repository<Player>,
    ) {}

    async getPendingGame(): Promise<Game | null> {
        return await this.gameRepo.findOne({
            where: {
                status: GameStatuses.PendingSecondPlayer,
            },
        });
    }

    async getPlayerById(playerId: string): Promise<Player | null> {
        return await this.playerRepo.findOne({
            where: {
                id: playerId,
            },
            relations: {
                user: true,
            },
        });
    }

    async checkIsUserTakePartInGame(userId: string): Promise<boolean> {
        const games = await this.gameRepo.find({
            where: { status: GameStatuses.Active },
        });

        const gamesIds = games.map((game: Game) => game.id);

        const players = await this.playerRepo.find({
            where: {
                game: { id: In([...gamesIds]) },
                user: { id: userId },
            },
        });

        return players.length > 0;
    }

    async createGame(userId: string): Promise<Game | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const id = uuid();

            // todo создать игру
            const gameRepository = queryRunner.manager.getRepository(Game);
            const game = gameRepository.create({
                status: GameStatuses.PendingSecondPlayer,
                player_1_id: id,
                player_2_id: null,
                gameQuestions: [],
                createdAt: new Date(),
                startedAt: null,
                finishedAt: null,
                answers: [],
            });
            await game.save();

            //todo создать игрока
            const playerRepository = queryRunner.manager.getRepository(Player);
            const player = playerRepository.create({
                id: id,
                game: game,
                score: 0,
                user: {
                    id: userId,
                },
            });

            await player.save();
            await queryRunner.commitTransaction();
            //todo вернуть игру
            return game;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }

    async connectToGame(gameId: string, userId: string): Promise<Game | null> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            //todo создать игрока
            const playerRepository = queryRunner.manager.getRepository(Player);
            const player = playerRepository.create({
                score: 0,
                user: {
                    id: userId,
                },
                game: { id: gameId },
            });
            await player.save();

            //todo попробовать присоединиться
            const gameRepository = queryRunner.manager.getRepository(Game);
            const updateGame = await gameRepository.update(
                {
                    status: GameStatuses.PendingSecondPlayer,
                    id: gameId,
                },
                {
                    player_2_id: player.id,
                    startedAt: new Date(),
                    status: GameStatuses.Active,
                },
            );

            if (updateGame.affected === 1) {
                await queryRunner.commitTransaction();
                return await this.gameRepo.findOne({
                    where: {
                        status: GameStatuses.Active,
                        id: gameId,
                    },
                });
            }
            await queryRunner.commitTransaction();
            return null;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            return null;
        } finally {
            await queryRunner.release();
        }
    }
}

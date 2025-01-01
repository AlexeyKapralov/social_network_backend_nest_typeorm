import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginatorDto } from '../../../../common/dto/paginator-dto';
import { TopGamePlayerViewDto } from '../../api/dto/output/top-game-player-view.dto';
import { TopPlayersInputDto } from '../../api/dto/input/top-players-input.dto';
import { User } from '../../../users/domain/user-entity';

export class GetTopPlayersPayload implements IQuery {
    constructor(public query: TopPlayersInputDto) {}
}

@QueryHandler(GetTopPlayersPayload)
export class GetTopPlayersQuery
    implements
        IQueryHandler<
            GetTopPlayersPayload,
            InterlayerNotice<GetTopPlayersResultType>
        >
{
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {}

    async execute(
        query: GetTopPlayersPayload,
    ): Promise<InterlayerNotice<GetTopPlayersResultType>> {
        const notice = new InterlayerNotice<GetTopPlayersResultType>();

        const sort = query.query.sort.map((i) => {
            return i.join(' ');
        });

        const usersCount = await this.userRepo.count();

        const users = await this.userRepo.query(
            `
            select * from (
            select
                "User"."id" as id,
                "User"."login" as login,
                SUM(p.score) "sumscore",
                COUNT(p.score) "gamescount",
                ROUND( cast(SUM(p.score) as decimal) / COUNT(p.score), 2) "avgscores",
                t."winscount",
                t."lossescount",
                t."drawscount"
            from
                "user" "User"
            left join player p on
                p."userId" = "User".id
            left join (
                select 
                    t."userId",
                    SUM(CASE WHEN t."gameStatus" = 'win' THEN 1 ELSE 0 END) AS "winscount",
                    SUM(CASE WHEN t."gameStatus" = 'draw' THEN 1 ELSE 0 END) AS "drawscount",
                    SUM(CASE WHEN t."gameStatus" = 'lose' THEN 1 ELSE 0 END) AS "lossescount"
                from (select 
                    g.id, 
                    p1.score p1Score, 
                    p2.score p2Score,
                    CASE
                        WHEN p1.score = p2.score THEN 'draw'
                        WHEN p1.score > p2.score THEN 'win'
                        ELSE 'lose'
                    END AS "gameStatus",
                    p1."userId"
                from game g
                left join player p1 on p1.id = g.player_1_id
                left join player p2 on p2.id = g.player_2_id
                union all
                select 
                    g.id, 
                    p1.score p1Score, 
                    p2.score p2Score,
                    CASE
                        WHEN p1.score = p2.score THEN 'draw'
                        WHEN p1.score > p2.score THEN 'lose'
                        ELSE 'win'
                    END AS "gameStatus",
                    p2."userId" 
                from game g
                left join player p1 on p1.id = g.player_1_id
                left join player p2 on p2.id = g.player_2_id) as t
                group by t."userId"
            ) t on t."userId" = "User"."id"
            group by
                "User"."id",
                "User"."login",
                t."winscount",
                t."lossescount",
                t."drawscount") t
                order by ${sort.join(', ')}
                limit $1 offset $2 
            `,
            [
                query.query.pageSize,
                (query.query.pageNumber - 1) * query.query.pageSize,
            ],
        );
        console.log('users', users);

        const items = users.map((u) => {
            return {
                sumScore: Number(u['sumscore']),
                avgScores: Number(u['avgscores']),
                gamesCount: Number(u['gamescount']),
                winsCount: Number(u['winscount']),
                lossesCount: Number(u['lossescount']),
                drawsCount: Number(u['drawscount']),
                player: {
                    id: u.id,
                    login: u.login,
                },
            };
        });

        notice.addData({
            pagesCount: Math.ceil(usersCount / query.query.pageSize),
            page: query.query.pageNumber,
            pageSize: query.query.pageSize,
            totalCount: usersCount,
            items,
        });

        return notice;
    }
}

export type GetTopPlayersResultType = PaginatorDto<TopGamePlayerViewDto>;

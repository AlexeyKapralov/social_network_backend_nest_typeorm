import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../../settings/env/configuration';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService<ConfigurationType>,
    ) {
        const apiSettings = configService.get('apiSettings', { infer: true });
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                JwtStrategy.extractJWT,
            ]),
            ignoreExpiration: false,
            secretOrKey: apiSettings.SECRET,
        });
    }

    private static extractJWT(req: Request): string | null {
        if (
            req.cookies &&
            'refreshToken' in req.cookies &&
            req.cookies.refreshToken.length > 0
        ) {
            return req.cookies.refreshToken;
        }
        return null;
    }

    async validate(payload: any) {
        payload.iat = new Date(payload.iat * 1000);
        payload.exp = new Date(payload.exp * 1000);
        return {
            payload: payload, //это всё будет в объекте user в request
        };
    }
}

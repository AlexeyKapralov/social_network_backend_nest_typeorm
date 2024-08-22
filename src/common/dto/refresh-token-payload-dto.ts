/**
 *  * deviceId - Object id string
 * * iat - число миллисекунд
 * * exp - число миллисекунд
 */
export class RefreshTokenPayloadDto {
    deviceId: string;
    iat: Date;
    exp: Date;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        collation: 'C',
    })
    login: string;

    @Column({
        collation: 'C',
    })
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column()
    createdAt: Date;

    @Column({ default: false })
    @Exclude()
    isDeleted: boolean;

    @Column()
    @Exclude()
    confirmationCode: string;

    @Column({ default: false })
    @Exclude()
    isConfirmed: boolean;

    @Column()
    @Exclude()
    confirmationCodeExpireDate: Date;

    // setLogin(newLogin: string) {
    //     this.login = newLogin;
    // }
    //
    // static createUser(userBody: UserInputDto, passHash: string, confirmationCode: string) {
    //     const user = new this();
    //
    //     user.email = userBody.email;
    //     user.createdAt = new Date().toISOString();
    //     user.password = passHash;
    //     user.login = userBody.login;
    //     user.isDeleted = false;
    //     user.isConfirmed = false;
    //     user.confirmationCode = confirmationCode;
    //
    //     return user;
    // }
}

// export const UserSchema = SchemaFactory.createForClass(User);
//
// UserSchema.methods = {
//     setLogin: User.prototype.setLogin,
// };
//
// UserSchema.statics = {
//     createUser: User.createUser,
// };
//
// export type UserStaticType = {
//     createUser: (userBody: UserInputDto, passHash: string, confirmationCode: string) => UserDocument;
// };
//
// export type UserDocument = HydratedDocument<User>;
// export type UserModelType = Model<UserDocument> & UserStaticType;

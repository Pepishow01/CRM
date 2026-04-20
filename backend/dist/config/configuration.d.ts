declare const _default: () => {
    port: number;
    database: {
        url: string | undefined;
    };
    redis: {
        url: string | undefined;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
};
export default _default;

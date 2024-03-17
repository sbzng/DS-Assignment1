import {
    APIGatewayRequestAuthorizerEvent,
    APIGatewayAuthorizerEvent,
    PolicyDocument,
    APIGatewayProxyEvent,
} from "aws-lambda";

import axios from "axios";
import jwt, { JwtPayload } from "jsonwebtoken";
import jwkToPem, { JWK } from "jwk-to-pem";

export type CookieMap = { [key: string]: string } | undefined;
export type JwtToken = { sub: string; email: string } | null;
export type Jwk = {
    keys: {
        alg: string;
        e: string;
        kid: string;
        kty: string;
        n: string;
        use: string;
    }[];
};

export const parseCookies = (
    event: APIGatewayRequestAuthorizerEvent | APIGatewayProxyEvent,
): CookieMap => {
    const cookiesStr = event.headers?.Cookie;
    if (!cookiesStr) {
        return undefined;
    }

    const cookiesArr = cookiesStr.split(';');
    const cookieMap: CookieMap = {};

    cookiesArr.forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        cookieMap[key] = value;
    });

    return cookieMap;
};


export const verifyToken = async (
    token: string,
    userPoolId: string | undefined,
    region: string,
): Promise<JwtToken> => {
    try {
        const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
        const { data } = await axios.get<Jwk>(url);
        const pem = jwkToPem(data.keys[0] as JWK);

        const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] }) as JwtPayload;
        return { sub: decoded.sub, email: decoded.email };
    } catch (err) {
        console.error("Token verification failed:", err);
        return null;
    }
};

export const createPolicy = (
    event: APIGatewayAuthorizerEvent,
    effect: string,
): PolicyDocument => ({
    Version: "2012-10-17",
    Statement: [{
        Effect: effect,
        Action: "execute-api:Invoke",
        Resource: [event.methodArn],
    }],
});

export const apiResponse = (
    statusCode: number,
    body: { [key: string]: any },
) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

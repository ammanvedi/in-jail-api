import express from 'express';
import { Express } from "express-serve-static-core";

const api: Express = express();
const port: string = process.env.JAIL_API_PORT || '3000';

api.get('/', ( req, res ) => {
    res.send('hello');
});

try {
    api.listen( parseInt(port), () => {
        console.log('Server was started successfully');
    } )
} catch (e) {
    console.log('Something went wrong starting the server!', e)
}

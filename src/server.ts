import express from 'express';
import { Express, Response } from "express-serve-static-core";
import {Cursor, MongoClient} from "mongodb";
import { connect } from "./db-connector";
import {Schema, Validator} from "jsonschema";
import {APIError, Artist, SchemaMap} from "./types";
import bodyParser from 'body-parser';
import {artistExists, buildArtistData, log, validateSchemaAndRespond} from "./helpers";

const PORT: string = process.env.PORT || '3000';
const MONGO_URL: string = process.env.MONGODB_URI || '';
const MONGO_DB_NAME: string = process.env.MONGODB_DB_NAME || 'api';
const MONGO_DB_COLLECTION: string = process.env.MONGODB_COLLECTION || 'artists';

const SCHEMAS: SchemaMap = {
    Artist: require('./schema/Artist.json'),
    CreateArtistBody: require('./schema/CreateArtistBody.json'),
    UpdateArtistIncarceration: require('./schema/UpdateArtistIncarceration.json'),
};

const run = async () => {
    const api: Express = express();
    api.use(bodyParser.json());
    const connection: MongoClient = await connect(MONGO_URL);
    const database = connection.db(MONGO_DB_NAME);
    const collection = database.collection(MONGO_DB_COLLECTION);
    const validator: Validator = new Validator();

    api.get('/artists', (req, res) => {
        const cursor: Cursor = collection.find({}, {
            projection: {
                _id: 0
            }
        });
        res.status(200);
        cursor.toArray()
            .then( ( array: Array<Artist> ) => {
                res.status(200);
                res.json(array);
                res.end();
            } )
            .catch( err => {
                res.status(500);
                log(`there was a problem making the query ${err}`, 'Error');
                res.end();
            } );
    } );

    api.post('/artists', async (req, res) => {
        const isValid = validateSchemaAndRespond(req.body, SCHEMAS.CreateArtistBody, res, validator);
        if ( !isValid ) {
            log('Request in wrong format', 'Error');
            return;
        }
        log('Request in correct format' );
        const existsAlready = await artistExists(req.body.alias, collection);

        if ( existsAlready ) {
            log('Object existed already' );
            res.status(409);
            const error: APIError = {
                description: `an artist with the name ${req.body.alias} already exists with id ${existsAlready}`
            };
            res.json(error);
            res.end();
            return;
        }

        log('Inserting artist' );
        const artist: Artist = buildArtistData( req.body );
        await collection.insertOne( artist );
        res.status(200);
        res.end();
    } );

    api.get('/artists/:id', ( req, res ) => {

    } );

    api.post('/artists/:id/status', (req, res) => {
        const isValid = validateSchemaAndRespond(req.body, SCHEMAS.UpdateArtistIncarceration, res, validator);
        if ( isValid ) {
        }
    } );

    try {
        api.listen( parseInt(PORT), () => {
            console.log('Server was started successfully');
        } )
    } catch (e) {
        console.log('Something went wrong starting the server!', e)
    }

};

run();
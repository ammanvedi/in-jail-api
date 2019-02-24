import express from 'express';
import { Express, Response } from "express-serve-static-core";
import {Cursor, MongoClient} from "mongodb";
import { connect } from "./db-connector";
import {Schema, Validator} from "jsonschema";
import {APIError, Artist, SchemaMap} from "./types";
import bodyParser from 'body-parser';
import {
    artistExists,
    buildArtistData,
    getArtistById, isAllowed,
    log,
    sendErrorResponse,
    validateSchemaAndRespond
} from "./helpers";

const API_KEY: string = process.env.JAIL_API_KEY || 'admin';
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

    api.get('/artists/incarcerated', (req, res) => {
        const cursor: Cursor = collection.find({
            'currentStatus.status.free': false
        }, {
            projection: {
                _id: 0,
                incarcerationHistory: 0
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

        if (!isAllowed(API_KEY, req, res)) {
            return;
        }

        const isValid = validateSchemaAndRespond(req.body, SCHEMAS.CreateArtistBody, res, validator);
        if ( !isValid ) {
            log('Request in wrong format', 'Error');
            return;
        }
        log('Request in correct format' );
        const existsAlready = await artistExists(req.body.alias, collection);

        if ( existsAlready ) {
            sendErrorResponse(
                409,
                `an artist with the name ${req.body.alias} already exists with id ${existsAlready}`,
                res
            );
            return;
        }

        log('Inserting artist' );
        const artist: Artist = buildArtistData( req.body );
        await collection.insertOne( artist );
        res.status(200);
        res.json({ id: artist.id });
        res.end();
    } );

    api.get('/artists/:id', ( req, res ) => {
        getArtistById(req.params.id, collection)
            .then( ( artist: Artist | null ) => {
                if ( artist ) {
                    res.status(200);
                    res.json( artist );
                    res.end();
                    return;
                }

                sendErrorResponse(404, 'no artist found with id', res);
            } )
            .catch(err => {
                sendErrorResponse(500, `something went wrong ${err}`, res);
            })
    } );

    api.post('/artists/:id/status', (req, res) => {

        if (!isAllowed(API_KEY, req, res)) {
            return;
        }

        const isValid = validateSchemaAndRespond(req.body, SCHEMAS.UpdateArtistIncarceration, res, validator);
        if ( isValid ) {
            const now = new Date();
            collection.updateOne( { id: req.params.id }, {
                $set: {
                    currentStatus: req.body
                },
                $push: {
                    incarcerationHistory: {
                        $each: [{
                            ...req.body,
                            added: {
                                timestamp: now.getTime(),
                                human: now.toISOString(),
                            }
                        }],
                        $sort: {
                            'added.timestamp': -1
                        }
                    }
                }
            } )
            .then(() => {
                res.status(200);
                res.end();
            })
            .catch( err => {
                sendErrorResponse(500, `there was a problem adding the data ${err}`, res );
            } )
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
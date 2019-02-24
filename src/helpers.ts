import {APIError, Artist, CreateArtistBody} from "./types";
import uuid from 'uuid/v4';
import {Collection} from "mongodb";
import {Schema, Validator} from "jsonschema";
import {Response} from "express-serve-static-core";

export const sendErrorResponse = (code: number, description: string, response: Response) => {
    log( description, 'Error' );
    response.status(code);
    response.json({
        description
    });
    response.end();
}

export const buildArtistData = ( requestData: CreateArtistBody ): Artist => ({
    ...requestData,
    id: uuid(),
    currentStatus: {
        status: {
            type: "NO_DATA_ADDED"
        },
        evidenceLinks: [],
    },
    incarcerationHistory: []
});

export const getArtistById = (id: string, collection: Collection): Promise<Artist|null> => {
    return collection.findOne<Artist>( { id } );
};

export const artistExists = ( alias: string, collection: Collection ): Promise<string | boolean> => {
    return collection.findOne<Artist>( { alias } )
        .then((artist: Artist | null) => {
            if ( !artist ) {
                return false;
            }
            return artist.id;
        })
        .catch(() => false)
};

export const log = (message: string, type: 'Error' | 'Log' = 'Log') => {
    console.log( `${ type }: ${ message }` );
};

export const validateSchemaAndRespond = (
    body: Object,
    schema: Schema,
    response: Response,
    validator: Validator ): boolean => {
    const { valid: isValid } = validator.validate( body, schema );

    if ( isValid ) {
        response.status(200);
        return true;
    }

    const error: APIError = {
        description: 'Data in incorrect format',
        expectedSchema: schema
    };
    response.status(400);
    response.json(error);
    response.end();
    return false;
};
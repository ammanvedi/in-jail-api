
/* UTIL TYPES */
import {Schema} from "jsonschema";

export type SchemaMap = {
    [ key: string ]: Schema,
}

export interface SiteSource {
    siteSourceName: string,
    link: string
}

export interface Timestamp {
    timestamp: number,
    human: string
}

export type FreedomStatus = 'FREE' | 'PAROLE' | 'JAIL' | 'PRISON' | 'BAIL' | 'ON_TRIAL' | 'NO_DATA_ADDED';

export interface IncarcerationType {
    free?: false,
    type: FreedomStatus
}

/* API TYPES */

export interface APIError {
    description: string,
    expectedSchema?: Schema
}

/* format by which we receive data to create a new artist */
export interface CreateArtistBody {
    firstName: string,
    lastName: string,
    alias: string,
    bioLinks?: Array<SiteSource>,
};

/* format by which we receive data to update wether a artist is in jail */
export interface UpdateArtistIncarceration {
    status: IncarcerationType,
    evidenceLinks: Array<SiteSource>
}

export interface IncarcerationStatus {
    status: IncarcerationType,
    added: Timestamp,
    evidenceLinks: Array<SiteSource>
}

/* DATABASE TYPES */

/* format in which data is stored in the mongo store */
export interface Artist extends CreateArtistBody {
    id: string,
    currentStatus: IncarcerationType,
    incarcerationHistory: Array<IncarcerationStatus>,
}
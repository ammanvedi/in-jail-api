import { MongoClient, MongoClientOptions } from "mongodb";

const DEFAULT_OPTIONS: MongoClientOptions = {
    useNewUrlParser: true
}

export const connect = (uri: string, options: MongoClientOptions = DEFAULT_OPTIONS): Promise<MongoClient> => {
    return new Promise( ( resolve, reject ) => {
        const connection = new MongoClient(uri, options);
        connection.connect(err => {
            if ( err ) {
                return reject();
            }
            resolve(connection);
        })
    } )
}
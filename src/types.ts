export interface Timestamp {
    timestamp: number,
    human: string
}

export interface SiteSource {
    siteSourceName: string,
    link: string
}

export type IncarcerationStatus = {
    inJail: boolean,
    added: Timestamp,
    evidenceLinks: Array<SiteSource>
}

export interface Rapper {
    firstName: string,
    lastName: string,
    alias: Array<string>,
    bioLinks: Array<SiteSource>,
    incarcerationHistory: Array<IncarcerationStatus>,
}
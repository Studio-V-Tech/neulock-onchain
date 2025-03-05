import metadataObject from '../contracts/assets/neu-onchain-metadata.json';

const traitMetadataUri = 'data:application/json;base64,' + Buffer.from(JSON.stringify(metadataObject)).toString('base64');

export default traitMetadataUri;
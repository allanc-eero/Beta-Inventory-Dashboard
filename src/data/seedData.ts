import { Device } from '@/types';

interface RawTester {
  name: string;
  email: string;
  contactEmail: string;
  serial: string;
  serial2?: string;
  serial3?: string;
  sku: string;
  config: string;
  country: string;
  location: string;
  status: string;
  tracking: string;
  uid: string;
  netId: string;
  internetSpeed: string;
  notes: string;
  region: string;
  so?: string;
  eta?: string;
  firmwareVersion?: string;
  networkGroup?: string;
}

function buildDevice(t: RawTester, index: number): Device {
  const hasNetwork = Boolean(t.netId);
  const notesLower = t.notes.toLowerCase();
  const statusLower = t.status.toLowerCase();
  const isExplicitlyNotOnline = notesLower.includes('not online');
  const isTransit = statusLower.includes('transit');
  const isNotOrdered = statusLower.includes('not ordered');

  let deviceStatus: Device['status'] = 'online';
  if (isNotOrdered) deviceStatus = 'not_online';
  else if (isExplicitlyNotOnline && !hasNetwork) deviceStatus = 'not_online';
  else if (isTransit && !hasNetwork) deviceStatus = 'not_online';
  else if (hasNetwork) deviceStatus = 'online';
  else if (!hasNetwork) deviceStatus = 'not_online';

  return {
    id: `seed-${t.region}-${index}`,
    serialNumber: t.serial,
    model: 'eero Max 7',
    manufacturer: 'eero',
    revision: t.config,
    revisionNotes: '',
    hardwareConfig: t.sku ? `${t.region} - Basic Box` : '',
    mac: '',
    internalName: 'Merci 10.2',
    sku: t.sku,
    partNumber: '',
    country: t.country,
    adminId: '',
    unitId: t.uid,
    deactivated: false,
    firmwareVersion: t.firmwareVersion || '',
    status: deviceStatus,
    assignedTo: t.name,
    assignedEmail: t.email,
    contactEmail: t.contactEmail || '',
    alternateEmail: '',
    location: t.location,
    adminLocation: '',
    network: t.netId,
    program: 'beta',
    assetTag: '',
    poExpensify: t.so || '',
    accountingId: '',
    cost: '',
    purchaseDate: '',
    imei1: '',
    imei2: '',
    eid: '',
    tracking: t.tracking,
    jira: '',
    checkedOutTo: t.name,
    checkedOutDate: t.eta || '',
    dueDate: '',
    notes: t.notes + (t.internetSpeed ? ` | ISP Speed: ${t.internetSpeed}` : ''),
    shipmentStatus: 'delivered',
    fcLocation: '',
    leg1Carrier: '',
    leg1Tracking: t.tracking,
    leg1Date: '',
    leg2Carrier: '',
    leg2Tracking: '',
    leg2Date: '',
    testbedId: '',
    testbedName: t.networkGroup || '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };
}

// ===== AUS TESTERS =====
const ausTesters: RawTester[] = [
  { name: 'Shakeel Ahmad', email: 'shkahma@amazon.com', contactEmail: 'shkahma@amazon.com', serial: 'GGC54MX36114004L', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Kew, VIC', status: 'Delivered', tracking: '5374120861', uid: 'UID0002961227', netId: '17001087', internetSpeed: '2 GB - 4 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497036', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Mark Jones', email: 'jonesaws@amazon.com', contactEmail: 'jonesaws@amazon.com', serial: 'GGC54MX36114003G', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Mount Evelyn, VIC', status: 'Delivered', tracking: '5374120850', uid: 'UID0015460987', netId: '14148818', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497037', eta: '4/9/2026', networkGroup: 'Kunka' },
  { name: 'Christer Whitehorn', email: 'cjw@amazon.com', contactEmail: 'christer.whitehorn@gmail.com', serial: 'GGC54MX361140036', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Manly, NSW', status: 'Delivered', tracking: '3704015840', uid: 'UID0001491131', netId: '17021062', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497038', eta: '4/7/2026', networkGroup: 'Kunka' },
  { name: 'Abilio Henrique', email: 'abilioh@amazon.com', contactEmail: 'abilioh@amazon.com', serial: 'GGC54MX36114003K', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Eagleby, QLD', status: 'Delivered', tracking: '5374122600', uid: 'UID0001510490', netId: '1763529', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497039', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Patrick Evans', email: 'evanpat@amazon.com.au', contactEmail: 'pevans1988@gmail.com', serial: 'GGC54MX36114001N', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Roseville, NSW', status: 'Delivered', tracking: '2394440974', uid: 'UID0001514314', netId: '1904562', internetSpeed: '2 GB - 4 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497040', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Santosh Choudhary', email: 'chosanto@amazon.com', contactEmail: 'santosh.choudhary@yahoo.com', serial: 'GGC54MX36114002T', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Mount Waverley, VIC', status: 'Delivered', tracking: '3704027762', uid: 'UID0002540258', netId: '17976851', internetSpeed: '10 GB+', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497041', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Aun Iftikhar', email: 'auniftik@amazon.com.au', contactEmail: 'auniftikhar@gmail.com', serial: 'GGC54MX36114000D', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Macquarie Park, NSW', status: 'In Transit', tracking: '2394440591', uid: 'UID0003110130', netId: '21977312', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Ship around January 17th, away till 20th', region: 'AUS', so: 'SO-497042', eta: '4/10/2026', networkGroup: 'Kunka' },
  { name: 'Sarah McLennan', email: 'sarahmcl@amazon.com.au', contactEmail: 'sarahmcl@amazon.com.au', serial: 'GGC54MX361140051', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Sydney, NSW', status: 'Delivered', tracking: '5374131442', uid: 'UID0003156079', netId: '', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Not online', region: 'AUS', so: 'SO-497043', eta: '4/8/2026', networkGroup: '' },
  { name: 'Jagdeep Singh', email: 'jgs@amazon.com', contactEmail: 'jag78au@gmail.com', serial: 'GGC54MX361140025', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Cranbourne North, VIC', status: 'Delivered', tracking: '2394441910', uid: 'UID0002547343', netId: '6031416', internetSpeed: '2 GB - 4 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497044', eta: '4/9/2026', networkGroup: 'Kunka' },
  { name: 'Hai Bu', email: 'haibu@amazon.com', contactEmail: 'haibu@amazon.com', serial: 'GGC54MX361140035', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Westleigh, NSW', status: 'Delivered', tracking: '2394439644', uid: 'UID0001501873', netId: '21724077', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497045', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Warren Cammack', email: 'wazza@amazon.com', contactEmail: 'warrencammack@gmail.com', serial: 'GGC54MX36114000S', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Naremburn, NSW', status: 'Delivered', tracking: '3704022033', uid: 'UID0001484552', netId: '20808414', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497046', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Frank Fan', email: 'frankfan@amazon.com', contactEmail: 'frankfan@amazon.com', serial: 'GGC54MX36114003X', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Ivanhoe, VIC', status: 'Delivered', tracking: '5374128885', uid: 'UID0005863851', netId: '', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Not online', region: 'AUS', so: 'SO-497047', eta: '4/8/2026', networkGroup: '' },
  { name: 'Andrew Purdon', email: 'apurdon@amazon.com.au', contactEmail: 'andrew_purdon@hotmail.com', serial: 'GGC54MX361140050', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Throsby, ACT', status: 'Delivered', tracking: '5374132212', uid: 'UID0001484507', netId: '20698876', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497048', eta: '4/9/2026', networkGroup: 'Kunka' },
  { name: 'Rizwan Wangde', email: 'wangderw@amazon.com', contactEmail: 'rizwan.wangde@gmail.com', serial: 'GGC54MX36114000P', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Gables, NSW', status: 'Delivered', tracking: '2394443973', uid: 'UID0003168693', netId: '20728094', internetSpeed: '2 GB - 4 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497049', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Nitesh Sthapit', email: 'sthapitn@amazon.com', contactEmail: 'nitesh.sthapit@gmail.com', serial: 'GGC54MX36114000E', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Denham Court, NSW', status: 'Delivered', tracking: '3704030245', uid: 'UID0001501936', netId: '17459617', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497050', eta: '4/8/2026', networkGroup: '' },
  { name: 'Adam Lynch', email: 'atlynch@amazon.com', contactEmail: 'adam@mooharhar.com', serial: 'GGC54MX361140043', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Wooloowin, QLD', status: 'Delivered', tracking: '3704025776', uid: 'UID0001732113', netId: '10025680', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497051', eta: '4/8/2026', networkGroup: '' },
  { name: 'Eduardo Menegalli Nazato', email: 'nazate@amazon.com', contactEmail: 'nazate@amazon.com', serial: 'GGC54MX36114000L', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Leppington, NSW', status: 'Delivered', tracking: '3704021090', uid: 'UID0001501899', netId: '4672923', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497052', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Joshua Starkweather', email: 'joshust@amazon.com', contactEmail: 'Jpstev@gmail.com', serial: 'GGC54MX36114002D', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Balgowlah, NSW', status: 'Delivered', tracking: '3704027773', uid: 'UID0003628675', netId: '20655224', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497053', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Wade Millican', email: 'wademil@amazon.com', contactEmail: 'wadeis@gmail.com', serial: 'GGC54MX361140014', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Sydney, NSW', status: 'Delivered', tracking: '5374126774', uid: 'UID0000545377', netId: '628441', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497054', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'David Freeman', email: 'davidcf@amazon.com', contactEmail: 'david@freemanit.com', serial: 'GGC54MX361140024', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Yeerongpilly, QLD', status: 'Delivered', tracking: '2394441416', uid: 'UID0003092012', netId: '', internetSpeed: 'Under 1 GB', notes: 'Laid off - Not testing', region: 'AUS', so: 'SO-497055', eta: '4/8/2026', networkGroup: '' },
  { name: 'Ian Green', email: 'iagre@amazon.com', contactEmail: 'iagre@amazon.com', serial: 'GGC54MX36114002F', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Hampton, VIC', status: 'Delivered', tracking: '3704015851', uid: 'UID0005856289', netId: '6064284', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497056', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Johnny Zhao', email: 'johnzhao@amazon.com', contactEmail: 'zhaoy22@hotmail.com', serial: 'GGC54MX36114002Q', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Kellyville, NSW', status: 'Delivered', tracking: '5374132772', uid: 'UID0001515134', netId: '', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Not online', region: 'AUS', so: 'SO-497057', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Adam Clark', email: 'cladam@amazon.com', contactEmail: 'adamclark8@me.com', serial: 'GGC54MX36114001J', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Greenough, WA', status: 'Delivered', tracking: '3704014974', uid: 'UID0022183915', netId: '21911890', internetSpeed: '2 GB - 4 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497058', eta: '4/14/2026', networkGroup: 'Kunka' },
  { name: 'Asad Gill', email: 'gillasad@amazon.com', contactEmail: 'asadgill_7@yahoo.com', serial: 'GGC54MX361140001', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Tarniet, VIC', status: 'Delivered', tracking: '2394439143', uid: 'UID0005225920', netId: '', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Not online', region: 'AUS', so: 'SO-497059', eta: '4/8/2026', networkGroup: '' },
  { name: 'Martin Guenthner', email: 'Guearndt@amazon.com', contactEmail: 'Guearndt@amazon.com', serial: 'GGC54MX361140032', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Kingsville, VIC', status: 'Delivered', tracking: '3704024800', uid: 'UID0001853339', netId: '20821541', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497060', eta: '4/8/2026', networkGroup: 'Kunka' },
  { name: 'Neil Cantrill', email: 'cantrill@amazon.com', contactEmail: 'ncantrill80@gmail.com', serial: 'GGC54MX36114004E', sku: 'NR-ME21115', config: 'EB5', country: 'Australia', location: 'Carlingford, NSW', status: 'Delivered', tracking: '3704026616', uid: 'UID0001728668', netId: '20781439', internetSpeed: 'Under 1 GB', notes: 'Amazonian - Device online ready for testing', region: 'AUS', so: 'SO-497061', eta: '4/8/2026', networkGroup: 'Kunka' },
];

// ===== EU TESTERS =====
const euTesters: RawTester[] = [
  { name: 'Luca Filippi', email: 'filippil@amazon.it', contactEmail: 'lucafill@gmail.com', serial: 'GGC54MX361140082', sku: 'ME21113', config: 'EB6', country: 'Italy', location: 'Milano, Italy', status: 'Delivered', tracking: '3662260560', uid: 'UID0003501165', netId: '4991619', internetSpeed: '10 GB+', notes: 'Device online ready for testing', region: 'EU', networkGroup: 'Kunka' },
  { name: 'Daniel Rubio Catalan', email: 'catdani@amazon.es', contactEmail: 'daniel.rubio.catalan@gmail.com', serial: 'GGC54MX36114007G', serial2: 'GGC54MX36114007E', sku: 'ME21113', config: 'EB6', country: 'Spain', location: 'Madrid, Spain', status: 'Delivered', tracking: '9658341055', uid: 'UID0008729939', netId: '20640558', internetSpeed: '10 GB+', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Volkan Tuerkoglu', email: 'vttuerko@amazon.de', contactEmail: 'volkan.tuerkoglu@gmx.de', serial: 'GGC54MX36114008W', sku: 'ME21113', config: 'EB6', country: 'Germany', location: 'Reinbek, Germany', status: 'Delivered', tracking: '1552375134', uid: '', netId: '', internetSpeed: '10 GB+', notes: 'Sent Slack - Not online', region: 'EU', networkGroup: '' },
  { name: 'Simone Scarlata', email: 'siscarla@amazon.it', contactEmail: 'siscarla@amazon.it', serial: 'GGC54MX36114007J', sku: 'ME21113', config: 'EB6', country: 'Italy', location: 'Palermo, Italy', status: 'Delivered', tracking: '9658340576', uid: 'UID0018454014', netId: '19172113', internetSpeed: '10 GB+', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Xavier Naunay', email: 'naunax@amazon.fr', contactEmail: 'naunax@amazon.fr', serial: 'GGC54MX36114006L', sku: 'ME21113', config: 'EB6', country: 'France', location: 'Rue Collin, France', status: 'Delivered', tracking: '9658340580', uid: 'UID0003604197', netId: '11949506', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Jandro Igual', email: 'rcalej@amazon.com', contactEmail: 'rcalej@amazon.com', serial: 'GGC54MX36114007M', serial2: 'GGC54MX361140086', sku: 'ME21113', config: 'EB6', country: 'Spain', location: 'Mislata, Valencia, Spain', status: 'Delivered', tracking: '9658341044', uid: '', netId: '', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'arnaud limoratto', email: 'imoratt@amazon.fr', contactEmail: 'arnaud.limoratto@gmail.com', serial: 'GGC54MX361140088', sku: 'ME21113', config: 'EB6', country: 'France', location: 'Saint Germaine en Laye, France', status: 'Delivered', tracking: '3662260582', uid: 'UID0008730056', netId: '19132874', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Leonardo Tonello', email: 'tonellol@amazon.it', contactEmail: 'tonellol@amazon.it', serial: 'GGC54MX36114006V', sku: 'ME21113', config: 'EB6', country: 'Italy', location: 'Castelfranco Veneto, Italy', status: 'Delivered', tracking: '9658340565', uid: 'UID0008783887', netId: '11605587', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Nicolas Lecocq', email: 'nleco@amazon.com', contactEmail: 'nleco@amazon.com', serial: 'GGC54MX36114008F', sku: 'ME21113', config: 'EB6', country: 'France', location: 'Saint Denis de l\'hotel, France', status: 'Delivered', tracking: '6969587914', uid: 'UID0003518891', netId: '4787915', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Rami Ftouhi', email: 'ramift@amazon.fr', contactEmail: 'ramift@amazon.fr', serial: 'GGC54MX36114006B', sku: 'ME21113', config: 'EB6', country: 'France', location: 'Lherm, France', status: 'Delivered', tracking: '3662260593', uid: '', netId: '', internetSpeed: '2 GB - 4 GB', notes: 'Did not confirm address - Not online', region: 'EU', networkGroup: '' },
  { name: 'Marco Sommella', email: 'sommella@amazon.it', contactEmail: 'sommella@amazon.it', serial: 'GGC54MX361140089', sku: 'ME21113', config: 'EB6', country: 'Italy', location: 'Rome, Italy', status: 'In Transit', tracking: '6969587962', uid: 'UID0008832325', netId: '21896351', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
  { name: 'Umberto Mancini', email: 'umancini@amazon.it', contactEmail: 'umancini@amazon.it', serial: 'GGC54MX36114005Q', sku: 'ME21113', config: 'EB6', country: 'Italy', location: 'Fiumicino, Italy', status: 'Delivered', tracking: '3662260571', uid: 'UID0011210595', netId: '21633602', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'EU', networkGroup: '' },
];

// ===== UK TESTERS =====
const ukTesters: RawTester[] = [
  { name: 'Simon Gent', email: 'sigent@amazon.co.uk', contactEmail: 'simon@packheath.co.uk', serial: 'GGC54MX36113000W', sku: 'ME21114', config: 'EB4', country: 'United Kingdom', location: 'Preston, UK', status: 'Delivered', tracking: '9658341626', uid: 'UID0011215618', netId: '', internetSpeed: '2 GB - 4 GB', notes: 'Sent Slack - Not online', region: 'UK', networkGroup: '' },
  { name: 'John Costello', email: 'Johncost@amazon.com', contactEmail: 'johnc1990@hotmail.co.uk', serial: 'GGC54MX361130010', serial2: 'GGC54MX36113000L', sku: 'ME21114', config: 'EB4', country: 'United Kingdom', location: 'Tyldesley, Manchester, UK', status: 'Delivered', tracking: '2741109663', uid: 'UID0003508650', netId: 'NET0003675892', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'UK', networkGroup: '' },
  { name: 'Dylan Whitehead', email: 'dylawh@amazon.co.uk', contactEmail: 'dylanwhitehead1999@gmail.com', serial: 'GGC54MX36113001J', serial2: 'GGC54MX36113001W', sku: 'ME21114', config: 'EB4', country: 'United Kingdom', location: 'Leeds, UK', status: 'Delivered', tracking: '9658341615', uid: 'UID0020431202', netId: 'NET0019102801', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'UK', networkGroup: '' },
  { name: 'Sebastian Collins', email: 'csebast@amazon.co.uk', contactEmail: 'sebbycollins@gmail.com', serial: 'GGC54MX36113001C', sku: 'ME21114', config: 'EB4', country: 'United Kingdom', location: 'Charlton, London, UK', status: 'Delivered', tracking: '2741109416', uid: 'UID0008923268', netId: '9137989', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'UK', networkGroup: '' },
  { name: 'Adam Longshaw', email: 'longshaw@gmail.com', contactEmail: 'longshaw@gmail.com', serial: 'GGC54MX36113000A', sku: 'ME21114', config: 'EB4', country: 'United Kingdom', location: 'Manchester, UK', status: 'Delivered', tracking: '9658341405', uid: 'UID0008730092', netId: 'NET0010985896', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'UK', networkGroup: '' },
  { name: 'Momo Kornher', email: 'kornherm@amazon.co.uk', contactEmail: 'mail@moritzkornher.de', serial: 'GGC54MX36113002J', sku: 'ME21114', config: 'EB6', country: 'United Kingdom', location: 'Glasgow, UK', status: 'Delivered', tracking: '9658341416', uid: 'UID0017035451', netId: 'NET0016649233', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'UK', networkGroup: '' },
];

// ===== US TESTERS =====
const usTesters: RawTester[] = [
  { name: 'Ryan Bernard', email: 'BernR27@gmail.com', contactEmail: 'BernR27@gmail.com', serial: 'GGC54MX36101007C', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Morganville, NJ', status: 'Delivered', tracking: '5396345721', uid: 'UID0009686314', netId: '', internetSpeed: '10 GB+', notes: 'Sent email 4/9, 4/17 - Not online', region: 'US', networkGroup: '' },
  { name: 'Eric Johansen', email: 'ejohansen@gmail.com', contactEmail: 'ejohansen@gmail.com', serial: 'GGC54MX361010010', serial2: 'GGC54MX36101003Q', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Saint Louis Park, MN', status: 'Delivered', tracking: '5972986725', uid: 'UID0000104599', netId: '145943', internetSpeed: '10 GB+', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Jade Hansen', email: 'jadehsn@aol.com', contactEmail: 'jadehsn@aol.com', serial: 'GGC54MX36101005F', serial2: 'GGC54MX361010060', serial3: 'GGC54MX361010020', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Lehi, UT', status: 'Delivered', tracking: '5396356055', uid: 'UID0000002155', netId: '147951', internetSpeed: '1 GB+', notes: 'Device online ready for testing', region: 'US', firmwareVersion: 'v7.12.0-6276+NIGHTLY-2025-09-09.prod.merci', networkGroup: 'Kunka' },
  { name: 'David Sica', email: 'david@sica.ws', contactEmail: 'david@sica.ws', serial: 'GGC54MX36101000H', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Fort Collins, CO', status: 'Delivered', tracking: '5396363044', uid: 'UID0000004799', netId: '18982269', internetSpeed: '10 GB+', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Brandon Inberg', email: 'binberg@gmail.com', contactEmail: 'binberg@gmail.com', serial: 'GGC54MX36101001E', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Belmont, CA', status: 'Delivered', tracking: '5973009162', uid: 'UID0011195807', netId: '21469263', internetSpeed: '8 GB - 9 GB+', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Anthony Maggio', email: 'maggioant@gmail.com', contactEmail: 'maggioant@gmail.com', serial: 'GGC54MX36101002L', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'San Francisco, CA', status: 'Delivered', tracking: '5973015694', uid: 'UID0000000577', netId: '21785019', internetSpeed: '10 GB+', notes: 'Sent email 4/9 - Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Anthony DiSarro', email: 'tony@thedisarros.com', contactEmail: 'tony@thedisarros.com', serial: 'GGC54MX36101003A', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Reading, PA', status: 'Delivered', tracking: '5973035272', uid: 'UID0000001010', netId: '139109', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Jesse Walthour', email: 'jessejames.walthour@gmail.com', contactEmail: 'jessejames.walthour@gmail.com', serial: 'GGC54MX36101000J', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Natrona Heights, PA', status: 'Delivered', tracking: '5396394570', uid: 'UID0017103339', netId: '21539507', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Ed Hudley', email: 'edhudley@yahoo.com', contactEmail: 'edhudley@yahoo.com', serial: 'GGC54MX36101006K', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Philadelphia, PA', status: 'Delivered', tracking: '5973041760', uid: 'UID0008221952', netId: '16423492', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Paul Conradt', email: 'paul@theconradts.net', contactEmail: 'paul@theconradts.net', serial: 'GGC54MX36101002V', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Puyallup, WA', status: 'Delivered', tracking: '5396418506', uid: 'UID0000097741', netId: '108959', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Randall Mikulas', email: 'melissa@thesmol.one', contactEmail: 'melissa@thesmol.one', serial: 'GGC54MX36112003D', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Pueblo, CO', status: 'Delivered', tracking: '5396425786', uid: 'UID0003348692', netId: '21503248', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Bobby Allen', email: 'ballen911@me.com', contactEmail: 'ballen911@me.com', serial: 'GGC54MX36112001L', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Watauga, TX', status: 'Delivered', tracking: '5396433276', uid: 'UID0013626285', netId: '12299986', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Tyler Diven', email: 'contact@tylerdiven.com', contactEmail: 'contact@tylerdiven.com', serial: 'GGC54MX36112003F', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Pittsburgh, PA', status: 'Delivered', tracking: '5973080304', uid: 'UID0016969896', netId: '20256901', internetSpeed: '2 GB - 4 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Andrew Cord', email: 'andrewcord@gmail.com', contactEmail: 'andrewcord@gmail.com', serial: 'GGC54MX361120020', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'College Station, TX', status: 'Delivered', tracking: '5396476783', uid: 'UID0000001152', netId: '20510280', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Joey Punneo', email: 'joey@punneo.com', contactEmail: 'joey@punneo.com', serial: 'GGC54MX361120042', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Yukon, OK', status: 'Delivered', tracking: '5973121512', uid: 'UID0000425595', netId: '18195444', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Eric Kelley', email: 'eric@keltechservices.co', contactEmail: 'eric@keltechservices.co', serial: 'GGC54MX36112002H', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Thousand Oaks, CA', status: 'Delivered', tracking: '5973127952', uid: 'UID0003164844', netId: '7042093', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Debbie Phillips-Carr', email: 'womynswrld@yahoo.com', contactEmail: 'womynswrld@yahoo.com', serial: 'GGC54MX36112000C', serial2: 'GGC54MX36112003K', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Beaumont, CA', status: 'Delivered', tracking: '5973132001', uid: 'UID0001708068', netId: '13070476', internetSpeed: '5 GB - 9 GB', notes: 'Sent email 4/9, 4/17 - Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Michael Porkert', email: 'mike.porkert@outlook.com', contactEmail: 'mike.porkert@outlook.com', serial: 'GGC54MX361120014', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Jacksonville, FL', status: 'Delivered', tracking: '5973134985', uid: 'UID0000703937', netId: '9352517', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Chip Wilson', email: 'chipwilson90@gmail.com', contactEmail: 'chipwilson90@gmail.com', serial: 'GGC54MX361120043', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Dallas, TX', status: 'Delivered', tracking: '5396497643', uid: 'UID0000002089', netId: '19645636', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Kyle DiSandro', email: 'disandrokyle@gmail.com', contactEmail: 'disandrokyle@gmail.com', serial: 'GGC54MX36112000Q', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Apex, NC', status: 'Delivered', tracking: '5973140865', uid: 'UID0002698311', netId: '2790119', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Bretton White', email: 'Info@shiftedoptics.com', contactEmail: 'Info@shiftedoptics.com', serial: 'GGC54MX36112001N', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Washougal, WA', status: 'Delivered', tracking: '5396507491', uid: 'UID0006938406', netId: '', internetSpeed: '10 GB+', notes: 'Sent email 4/9, 4/17 - Not online', region: 'US', networkGroup: '' },
  { name: 'Ken MacInnis', email: 'ken.macinnis@gmail.com', contactEmail: 'ken.macinnis@gmail.com', serial: 'GGC54MX361120006', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Oakland, CA', status: 'Delivered', tracking: '5973151671', uid: 'UID0004777932', netId: '20771313', internetSpeed: '10 GB+', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Alexander Van deventer', email: 'Allowed@live.com', contactEmail: 'Allowed@live.com', serial: 'GGC54MX361120011', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Oakland, CA', status: 'Delivered', tracking: '5396514841', uid: 'UID0003716450', netId: '5368661', internetSpeed: '10 GB+', notes: 'Sent email 4/9, 4/17 - Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Shawn Silverman', email: 'shawn@pobox.com', contactEmail: 'shawn@pobox.com', serial: 'GGC54MX36112002A', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Oakland, CA', status: 'Delivered', tracking: '5396520920', uid: 'UID0003512866', netId: '5447536', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
  { name: 'Alex Trees', email: 'alextrees97@gmail.com', contactEmail: 'alextrees97@gmail.com', serial: 'GGC54MX36112002C', sku: 'ME21111', config: 'EB4', country: 'United States', location: 'Walnut Creek, CA', status: 'Delivered', tracking: '5396523602', uid: 'UID0000849290', netId: '18962163', internetSpeed: '5 GB - 9 GB', notes: 'Device online ready for testing', region: 'US', networkGroup: '' },
];

// Build all devices from raw data
const allRawTesters = [...ausTesters, ...euTesters, ...ukTesters, ...usTesters];

export const seedDevices: Device[] = allRawTesters.map((t, i) => buildDevice(t, i));

// Also generate secondary devices for testers with serial2/serial3
const secondaryDevices: Device[] = [];
allRawTesters.forEach((t, i) => {
  if (t.serial2) {
    secondaryDevices.push(buildDevice({ ...t, serial: t.serial2, notes: `Secondary device for ${t.name}` }, 1000 + i));
  }
  if (t.serial3) {
    secondaryDevices.push(buildDevice({ ...t, serial: t.serial3, notes: `Third device for ${t.name}` }, 2000 + i));
  }
});

export const allSeedDevices: Device[] = [...seedDevices, ...secondaryDevices];

// Generate people from the tester data
export const seedPeople = Array.from(
  new Map(
    allRawTesters.map((t) => [
      t.email,
      {
        id: `person-${t.email}`,
        name: t.name,
        email: t.email,
        team: `Beta ${t.region}`,
        devices: [] as string[],
      },
    ])
  ).values()
);

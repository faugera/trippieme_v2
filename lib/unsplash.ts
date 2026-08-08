import 'server-only';
import { normaliseText } from '@/lib/text';

/** A curated, static catalogue: no API key, request or third-party rate limit. */
export type TripCover = {
  imageUrl: string;
  alt: string;
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
};

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

export const DESTINATION_PHOTOS: Record<string, string> = {
  london: img('1513635269975-59663e0ac1ad'), londres: img('1513635269975-59663e0ac1ad'), bigben: img('1513635269975-59663e0ac1ad'), towerbridge: img('1513635269975-59663e0ac1ad'),
  newyork: img('1609837775341-049fe9673fb3'), nyc: img('1609837775341-049fe9673fb3'), manhattan: img('1496442226666-8d4d0e62e6e9'), statuedelaliberte: img('1609837775341-049fe9673fb3'), statueliberty: img('1609837775341-049fe9673fb3'),
  paris: img('1502602898657-3e91760cbb34'), eiffel: img('1502602898657-3e91760cbb34'), toureiffel: img('1502602898657-3e91760cbb34'),
  rome: img('1552832230-c0197dd311b5'), roma: img('1552832230-c0197dd311b5'), colosseum: img('1552832230-c0197dd311b5'), colisee: img('1552832230-c0197dd311b5'),
  tokyo: img('1503899036084-c55cdd92da26'), shibuya: img('1503899036084-c55cdd92da26'), fuji: img('1578637387939-43c525550085'),
  barcelona: img('1583422409516-2895a771deda'), barcelone: img('1583422409516-2895a771deda'), sagrada: img('1583422409516-2895a771deda'),
  kyoto: img('1493976040374-85c8e12f0c0e'), fushimi: img('1493976040374-85c8e12f0c0e'), venice: img('1514890547357-a9ee288728e0'), venise: img('1514890547357-a9ee288728e0'),
  lisbon: img('1513735718075-2e2d37cb7513'), lisbonne: img('1513735718075-2e2d37cb7513'), amsterdam: img('1512470876302-972faa2aa9a4'), berlin: img('1560969184-10fe8719e047'), madrid: img('1539037116277-4db20889f2d4'),
  sydney: img('1506973035872-a4ec16b8e8d9'), losangeles: img('1580655653885-65763b2597d0'), hollywood: img('1580655653885-65763b2597d0'), sanfrancisco: img('1501594907352-04cda38ebc29'), chicago: img('1494522855154-9297ac14b55f'), miami: img('1506966953377-3f9232c4068b'),
  dubai: img('1512453979798-5ea266f8880c'), bangkok: img('1508009603885-50cf7c579365'), bali: img('1537996194471-e657df975ab4'), marrakech: img('1597212618440-806262de4f6b'), marrakesh: img('1597212618440-806262de4f6b'), prague: img('1519671482749-fd09be7ccebf'),
  vienna: img('1516550893923-42d28e5677af'), vienne: img('1516550893923-42d28e5677af'), florence: img('1543429776-2782fc8e1acd'), firenze: img('1543429776-2782fc8e1acd'), athens: img('1555993539-1732b0258235'), athenes: img('1555993539-1732b0258235'), istanbul: img('1524231757912-21f4fe3a7200'),
  cairo: img('1503177119275-0aa32b3a9368'), lecaire: img('1503177119275-0aa32b3a9368'), pyramides: img('1503177119275-0aa32b3a9368'), rio: img('1483729558449-99ef09a8c325'), riodejaneiro: img('1483729558449-99ef09a8c325'),
  singapore: img('1525625293386-3f8f99389edd'), singapour: img('1525625293386-3f8f99389edd'), seoul: img('1538485399081-7191377e8241'), hongkong: img('1508804185872-d7badad00f7d'), toronto: img('1517090504586-fde19ea6066f'), montreal: img('1519178614-68673b21c6fa'), vancouver: img('1559511260-66a654ae982a'), dublin: img('1549918864-48ac978761a4'),
  edinburgh: img('1506377247377-2a5b3b417ebb'), edimbourg: img('1506377247377-2a5b3b417ebb'), seville: img('1560930950-5cc20e80e392'), sevilla: img('1560930950-5cc20e80e392'), nice: img('1533105079780-92b9be482077'), marseille: img('1584646098378-0874589d76b1'), lyon: img('1578328819058-b69f3a3b0f6b'), bordeaux: img('1565610222536-ef125c59da2e'),
  brussels: img('1559113513-d5e09c78b9dd'), bruxelles: img('1559113513-d5e09c78b9dd'), zurich: img('1515488042361-ee00e0ddd4e4'), copenhagen: img('1513622470522-26c3c8a854bc'), copenhague: img('1513622470522-26c3c8a854bc'), stockholm: img('1509356843151-3e7d96241e11'), oslo: img('1527004013197-933c4bb611b3'), budapest: img('1541872703-74c5e44368f9'),
  munich: img('1595867818082-083862f3d630'), muenchen: img('1595867818082-083862f3d630'), iceland: img('1504893524553-b855bce32c67'), islande: img('1504893524553-b855bce32c67'), reykjavik: img('1504893524553-b855bce32c67'), greece: img('1570077188670-e3a8d69ac5ff'), grece: img('1570077188670-e3a8d69ac5ff'), santorini: img('1570077188670-e3a8d69ac5ff'), santorin: img('1570077188670-e3a8d69ac5ff'),
  porto: img('1555881400-74d7acaacd8b'), milan: img('1513584684374-8bab748fbf90'), milano: img('1513584684374-8bab748fbf90'), naples: img('1534447677768-be436bb09401'), napoli: img('1534447677768-be436bb09401'),
};

export const FALLBACK_TRAVEL_PHOTOS = [
  img('1488646953014-85cb44e25828'), img('1469854523086-cc02fe5d8800'), img('1476514525535-07fb3b4ae5f1'),
  img('1503220317375-aaad61436b1b'), img('1507525428034-b723cf961d3e'), img('1477959858617-67f30ac72604'),
];

function fallbackFor(value: string) {
  const hash = [...normaliseText(value)].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 0);
  return FALLBACK_TRAVEL_PHOTOS[hash % FALLBACK_TRAVEL_PHOTOS.length];
}

/** Resolves city labels, accents and landmark synonyms with a stable generic fallback. */
export function getDestinationCover(destination: string): TripCover {
  const normalized = normaliseText(destination);
  const key = Object.keys(DESTINATION_PHOTOS).find((candidate) => normalized.includes(candidate));
  return {
    imageUrl: key ? DESTINATION_PHOTOS[key] : fallbackFor(destination),
    alt: key ? `Vue de ${destination.split(',')[0].trim()}` : 'Inspiration voyage',
    photographerName: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
    unsplashUrl: 'https://unsplash.com',
  };
}

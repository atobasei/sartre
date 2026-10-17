// Real Open Library works, cover IDs and median page counts, looked up and verified on 2026-10-16.
// Display titles/authors/years are curated: OL search returns original-language titles
// ("L'étranger"), study guides and wrong first-publish years for some classics, which is
// exactly why our own `books` cache owns the display fields.
// Anna Karenina intentionally has no cover ID so the fallback cover is always on screen.
import type { Book, Edition } from '@sartre/core';

export interface CatalogEntry {
  book: Book;
  edition: Edition;
}

function entry(
  key: string,
  title: string,
  author: string,
  firstPublishYear: number,
  olWorkId: string,
  coverId: number | undefined,
  pageCount: number,
  olEditionId?: string,
): CatalogEntry {
  return {
    book: {
      id: `bk-${key}`,
      title,
      authors: [{ name: author }],
      firstPublishYear,
      coverId,
      external: { olWorkId },
    },
    edition: {
      id: `ed-${key}`,
      bookId: `bk-${key}`,
      pageCount,
      coverId,
      format: 'paperback',
      external: { olEditionId },
    },
  };
}

export const catalog = {
  tomorrow: entry('tomorrow', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 2022, 'OL26004554W', 12859975, 460),
  piranesi: entry('piranesi', 'Piranesi', 'Susanna Clarke', 2020, 'OL20893680W', 10226290, 272, 'OL28300471M'),
  remains: entry('remains', 'The Remains of the Day', 'Kazuo Ishiguro', 1989, 'OL59048W', 95742, 254, 'OL7856480M'),
  copperhead: entry('copperhead', 'Demon Copperhead', 'Barbara Kingsolver', 2022, 'OL27052926W', 13141227, 560, 'OL37691823M'),
  stoner: entry('stoner', 'Stoner', 'John Williams', 1965, 'OL3511459W', 8310729, 293, 'OL20190435M'),
  neverLetMeGo: entry('never-let-me-go', 'Never Let Me Go', 'Kazuo Ishiguro', 2005, 'OL59038W', 1047334, 319, 'OL9129121M'),
  secretHistory: entry('secret-history', 'The Secret History', 'Donna Tartt', 1992, 'OL4321141W', 744854, 608, 'OL3319855M'),
  normalPeople: entry('normal-people', 'Normal People', 'Sally Rooney', 2018, 'OL20150260W', 8794265, 304, 'OL27330017M'),
  pachinko: entry('pachinko', 'Pachinko', 'Min Jin Lee', 2017, 'OL17762217W', 8044605, 512, 'OL26359448M'),
  overstory: entry('overstory', 'The Overstory', 'Richard Powers', 2018, 'OL19074847W', 8758252, 531, 'OL26949293M'),
  stationEleven: entry('station-eleven', 'Station Eleven', 'Emily St. John Mandel', 2014, 'OL17202418W', 7369961, 352, 'OL25774147M'),
  bardo: entry('bardo', 'Lincoln in the Bardo', 'George Saunders', 2017, 'OL17635834W', 7909378, 426, 'OL26241326M'),
  road: entry('road', 'The Road', 'Cormac McCarthy', 2006, 'OL40873W', 198120, 256, 'OL9666775M'),
  beloved: entry('beloved', 'Beloved', 'Toni Morrison', 1987, 'OL50548W', 8261367, 321, 'OL2741128M'),
  middlemarch: entry('middlemarch', 'Middlemarch', 'George Eliot', 1871, 'OL20867W', 252882, 793, 'OL7455461M'),
  annaKarenina: entry('anna-karenina', 'Anna Karenina', 'Leo Tolstoy', 1878, 'OL267096W', undefined, 864),
  eastOfEden: entry('east-of-eden', 'East of Eden', 'John Steinbeck', 1952, 'OL23166W', 11386937, 613, 'OL22640535M'),
  gilead: entry('gilead', 'Gilead', 'Marilynne Robinson', 2004, 'OL1875009W', 1472533, 257, 'OL3311020M'),
  housekeeping: entry('housekeeping', 'Housekeeping', 'Marilynne Robinson', 1980, 'OL1875010W', 223038, 224, 'OL4109190M'),
  nameOfTheRose: entry('name-of-the-rose', 'The Name of the Rose', 'Umberto Eco', 1980, 'OL8996439W', 8598263, 533, 'OL21189675M'),
  solitude: entry('solitude', 'One Hundred Years of Solitude', 'Gabriel García Márquez', 1967, 'OL274505W', 12627383, 417, 'OL37050600M'),
  leftHand: entry('left-hand', 'The Left Hand of Darkness', 'Ursula K. Le Guin', 1969, 'OL59800W', 10618463, 304, 'OL31935740M'),
  hailMary: entry('hail-mary', 'Project Hail Mary', 'Andy Weir', 2021, 'OL21745884W', 11200092, 496, 'OL32553390M'),
  educated: entry('educated', 'Educated', 'Tara Westover', 2018, 'OL18139176W', 8314077, 384, 'OL26620627M'),
  bellJar: entry('bell-jar', 'The Bell Jar', 'Sylvia Plath', 1963, 'OL1865528W', 8477115, 262, 'OL21389163M'),
  nausea: entry('nausea', 'Nausea', 'Jean-Paul Sartre', 1938, 'OL1161171W', 9393973, 240, 'OL4787730M'),
  stranger: entry('stranger', 'The Stranger', 'Albert Camus', 1942, 'OL1230613W', 13151269, 143, 'OL6508147M'),
  klara: entry('klara', 'Klara and the Sun', 'Kazuo Ishiguro', 2021, 'OL20883297W', 10648686, 334, 'OL31971025M'),
  babel: entry('babel', 'Babel', 'R. F. Kuang', 2022, 'OL26443093W', 12468631, 577),
  lonesomeDove: entry('lonesome-dove', 'Lonesome Dove', 'Larry McMurtry', 1985, 'OL134601W', 8376548, 945, 'OL3021983M'),
  karamazov: entry('karamazov', 'The Brothers Karamazov', 'Fyodor Dostoevsky', 1880, 'OL10432709W', 8272336, 821, 'OL24646215M'),
  gentleman: entry('gentleman', 'A Gentleman in Moscow', 'Amor Towles', 2016, 'OL17797130W', 11326818, 511, 'OL26386597M'),
  intermezzo: entry('intermezzo', 'Intermezzo', 'Sally Rooney', 2024, 'OL37949460W', 15248784, 459, 'OL62489435M'),
} satisfies Record<string, CatalogEntry>;

export type CatalogKey = keyof typeof catalog;

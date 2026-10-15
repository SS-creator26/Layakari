import type { TaalId } from "./music";

/** The six starter pieces from the original site, offered to composers trying Studio for the first time. */
export const SAMPLE_COMPOSITIONS: {
  title: string;
  form: string;
  taal: TaalId;
  laya: string;
  bpm: number;
  bols: string;
  price_listen: number;
  price_perform: number;
  price_teach: number;
}[] = [
  {
    title: "Megh Malhar Paran",
    form: "Paran",
    taal: "teentaal",
    laya: "Madhya",
    bpm: 96,
    bols: "Dha-ge-tita Kat-ta Gadi-gana Dha\nKran-dha Kran-dha Dha-ge Na-dha\nTira-kita Taka Dhum-kita Taka\nDha – Kran-dha Kran-dha Dha (×3)",
    price_listen: 2,
    price_perform: 25,
    price_teach: 99,
  },
  {
    title: "Chakradar Tihai No. 7",
    form: "Chakradar",
    taal: "teentaal",
    laya: "Drut",
    bpm: 132,
    bols: "Dhit-ta Dhit-ta Kat-ta Ga-di\nGa-na Dha – Dhit-ta Dhit-ta\nKat-ta Ga-di Ga-na Dha –\n(whole phrase three times, landing on sam)",
    price_listen: 2,
    price_perform: 20,
    price_teach: 79,
  },
  {
    title: "Barkha Tukda",
    form: "Tukda",
    taal: "jhaptaal",
    laya: "Madhya",
    bpm: 88,
    bols: "Ta Thei Thei Tat | Aa Thei\nThei Tat Ta | Thei Ta Thei\nTigdha Dig Dig Thei (×3)",
    price_listen: 2,
    price_perform: 15,
    price_teach: 69,
  },
  {
    title: "Radha Kavitt",
    form: "Kavitt",
    taal: "rupak",
    laya: "Vilambit",
    bpm: 66,
    bols: "Shyam kahe sun Radhe pyari\nBansi baje Yamuna kinare\nDha Ki Ta Dha | Thei Thei Tat\nTigdha Dig Dig Thei (×3)",
    price_listen: 2,
    price_perform: 25,
    price_teach: 99,
  },
  {
    title: "Ektaal Gat Nikas",
    form: "Gat",
    taal: "ektaal",
    laya: "Madhya",
    bpm: 84,
    bols: "Ta – Thei – | Tat – Aa –\nThei Thei Tat | Ta Thei Thei\nGat walk: right, left, chakkar on sam",
    price_listen: 2,
    price_perform: 15,
    price_teach: 69,
  },
  {
    title: "Basant Tatkar Set",
    form: "Tatkar",
    taal: "teentaal",
    laya: "Vilambit",
    bpm: 60,
    bols: "Ta Thei Thei Tat | Aa Thei Thei Tat\nTa Thei Thei Tat | Aa Thei Thei Tat\nThen dugun and chaugun",
    price_listen: 2,
    price_perform: 10,
    price_teach: 49,
  },
];

/** The landing page's playable example. */
export const DEMO_PIECE = SAMPLE_COMPOSITIONS[0]!;

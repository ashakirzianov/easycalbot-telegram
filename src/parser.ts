import {
    prefixes, translate, Parser, choice, iff,
    decimal, seq, prefix, projectLast, maybe, trimS, ifDefined, trim, anything,
} from "./parserCombinators";
import { mapAndConcat } from "./utils";
import { locales, localeSelector, Locale } from "./locale";
import { Month, Year, Day, months, RelativeDate, ParsedRecord, numToMonth } from "./model";

// Year
const yearDec = decimal;
const yearWithApostrophe = projectLast(seq(prefix("'"), decimal));

const year: Parser<Year> = choice(yearDec, yearWithApostrophe);
const tyear = trimS(year);

// Month

function monthParser(month: Month, key: keyof Locale) {
    return translate(
        prefixes(...mapAndConcat(locales, localeSelector(key))),
        () => month,
    );
}


const january = monthParser(0, 'jan');
const february = monthParser(1, 'feb');
const march = monthParser(2, 'mar');
const april = monthParser(3, 'apr');
const may = monthParser(4, 'may');
const june = monthParser(5, 'jun');
const july = monthParser(6, 'jul');
const august = monthParser(7, 'aug');
const september = monthParser(8, 'sep');
const october = monthParser(9, 'oct');
const november = monthParser(10, 'nov');
const december = monthParser(11, 'dec');

const month: Parser<Month> = choice(
    january, february, march, april, may, june,
    july, august, september, october, november, december,
);
const tmonth = trimS(month);

// Day

const dayDec = iff(decimal, d => d > 0 && d <= 31);
const day: Parser<Day> = dayDec;
const tday = trimS(day);

// Date formats

const tcomma = trimS(prefix(','));
const tslash = trimS(prefix('/'));
const tdot = trimS(prefix('.'));

type DateParser = Parser<RelativeDate>;

const stringDate: DateParser = translate(
    seq(tmonth, maybe(tday), maybe(tcomma), maybe(tyear)),
    ([m, d, c, y]) => ({
        month: m,
        day: d,
        year: y,
    }),
);

const numMonth = translate(
    iff(decimal, d => d > 0 && d <= 12),
    m => m - 1,
);

const americanDate: DateParser = translate(
    seq(trimS(numMonth), tslash, tday, tslash, tyear),
    ([m, s1, d, s2, y]) => ({
        month: m,
        day: d,
        year: y,
    }),
);

const euroDate: DateParser = translate(
    seq(tday, tdot, trimS(numMonth), tdot, tyear),
    ([d, d1, m, d2, y]) => ({
        day: d,
        month: m,
        year: y,
    }),
);

const date: DateParser = choice(euroDate, americanDate, stringDate);

// Full

const separator = trim(prefixes('-', '--', '—', ':'));
const message = anything;

const recordParser: Parser<ParsedRecord> = translate(
    seq(date, maybe(separator), message),
    ([d, s, m]) => ({
        date: d,
        text: m,
    }),
);

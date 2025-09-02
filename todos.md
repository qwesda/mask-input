# todos

## base

- [x] ~~emit `update:state', `update:derivedState` events~~
- [x] ~~add support for `characterInputSubstitutionFn`~~
- [x] ~~fix missing `data-value-pos-right`/ `data-value-pos-left` attributes for mask characters~~
- [x] ~~use `splitIntoGraphemes` where appropriate~~
- [x] ~~maybe store value characters as `string[]` pre-split by `splitIntoGraphemes`~~
- [x] ~~composition input is currently broken~~
- [x] ~~input element size measurement is currently broken~~ 
- [x] ~~ensure all section values are initialized~~
- [x] ~~make spin functions return the whole values[]~~
- [x] ~~alt right/left should always switch to the next/prev section~~
- [x] ~~add cmd+a/crtl+a support~~
- [x] ~~handle section advance by using skip keys~~
- [x] ~~don't blur/focus input element when on mobile~~
- [x] ~~update mouse event handling similar to keyboard event handling~~
- [x] ~~add mouse drag support for selection~~
- [x] ~~handle double click for section selection / triple click for whole selection~~
- [x] ~~add whole value copy/pase support~~
- [x] ~~maybe replace fake selection highlight with native browser selection highlight~~
- [x] ~~maybe de-vueify the component~~
- [x] ~~merge spinUp and spinDown functions~~
- [x] ~~change maskingFn to receive all section values~~
- [x] ~~add `autoAdvanceFn` for dynamic section lengths~~
- [x] skipkeys shouldn't keep selection
- [x] delete selection should put cursor to lower pos
- [ ] holding key should repeat last key
- [ ] maybe add partial (selection) copy/pase support
- [ ] maybe add highlighting of problematic sections for semantic validation
- [ ] maybe dynamic section hiding based on cursor position and values
- [ ] __maybe__ add keyStroke interception Fn

## masks 

- [x] ~~uuid~~
- [x] year/month
- [x] year
- [x] year/week
- [ ] date+time
- [x] ipv4
- [ ] ipv4 subnet
- [x] ipv6
- [ ] ipv6 subnet
- [x] ISRC
- [x] EAN13
- [ ] UPC
- [ ] ISWC
- [x] ISBN
- [ ] GTIN
- [ ] GRID
- [ ] IBAN
- [ ] credit cards
- [ ] zip codes
- [ ] discogs artist id :: bigint, no check digit
- [ ] apple artist id :: bigint, no check digit
- [ ] spotify artist id :: ai overview says: There is no documented Spotify Artist ID check digit system; however, the Spotify ID itself is a base-62 identifier
- [ ] isni artist id :: https://en.wikipedia.org/wiki/International_Standard_Name_Identifier
- [ ] ipn artist id :: ai overview says: The International Performer Number (IPN) has a two-digit check digit, but the specific algorithm for its calculation is not publicly available, as it is managed by SCAPR (the international network of collective management organizations) and its member CMOs like PPL.
- [ ] VAT ID (as in Umsatzsteuer-Identifikationsnummer)
- [ ] German Tax ID
- [ ] EIN (US - Employer Identification Number)

## test app

- [x] ~~split out playground sections~~
- [x] ~~better display of debug info~~

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
- [ ] holding key should repeat last key
- [ ] maybe add partial (selection) copy/pase support
- [ ] maybe add highlighting of problematic sections for semantic validation
- [ ] maybe dynamic section hiding based on cursor position and values

## masks 

- [x] ~~uuid~~
- [x] year/month
- [ ] year
- [ ] date+time
- [ ] year/week
- [ ] ipv4 subnet
- [ ] ipv6 subnet
- [ ] isrc
- [ ] barcode (ean13, upc, isbn)

## test app

- [x] ~~split out playground sections~~
- [x] ~~better display of debug info~~

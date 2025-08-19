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
- [ ] handle section advance by using skip keys
- [ ] add cmd+a/crtl+a support
- [ ] holding key should repeat last key
- [ ] don't blur/focus input element when on mobile
 
- [ ] update mouse event handling similar to keyboard event handling
- [ ] add mouse drag support for selection
- [ ] handle double click for section selection / triple click for whole selection 

- [ ] add whole value copy/pase support
- [ ] add partial (selection) copy/pase support
- [ ] maybe add highlighting of problematic sections for semantic validation
- [ ] maybe dynamic section hiding based on cursor position and values
- [ ] maybe replace fake selection highlight with native browser selection highlight
- [ ] maybe de-vueify the component

## masks 

- [ ] date+time mask
- [ ] year mask
- [ ] year/month
- [ ] year/week
- [ ] ipv4 subnet mask
- [ ] ipv6 subnet mask
- [ ] barcode mask (ean13, upc, isbn)
- [x] ~~uuid~~

## test app

- [x] ~~split out playground sections~~
- [x] ~~better display of debug info~~

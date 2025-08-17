# todos

## base

- [x] ~~emit `update:state', `update:derivedState` events~~
- [ ] add support for `characterInputSubstitutionFn`
- [ ] fix missing `data-value-pos-right`/ `data-value-pos-left` attributes for mask characters
- [ ] use `splitIntoGraphemes` where appropriate
- [ ] maybe store value characters as `string[]` pre-split by `splitIntoGraphemes`
- [ ] update mouse event handling similar to keyboard event handling
- [ ] add mouse drag support for selection
- [ ] make spin functions return the whole values[]
- [ ] add whole value copy/pase support
- [ ] add partial (selection) copy/pase support
- [ ] add cmd+a/crtl+a support
- [ ] maybe add highlighting of problematic sections for semantic validation
- [ ] maybe de-vueify the component
- [ ] maybe dynamic section hiding based on cursor position and values
- [ ] replace fake selection highlight with native browser selection highlight

## masks 

- [ ] date+time mask
- [ ] year mask
- [ ] year/month
- [ ] year/week
- [ ] ipv4 subnet mask
- [ ] ipv6 subnet mask
- [ ] barcode mask (ean13, upc, isbn)

## test app

- [ ] split out playground sections
- [ ] better display of debug info

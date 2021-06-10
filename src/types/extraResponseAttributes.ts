/**
 * Represents a SASjs request parameter that will select which attributes are wanted in
 * response object on top of default `webout` object.
 * 
 * Full functionality is not built yet, currently only supported attribute is `log`
 * 
 * Default webout object will be standalone if none attributes selected.
 * If at least one attribute is selected, webout object will be put inside `result` object.
 */
export type ExtraResponseAttributes = 'file' | 'data' | 'log'

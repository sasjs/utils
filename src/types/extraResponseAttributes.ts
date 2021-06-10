/**
 * Represents a SASjs request parameter that will select which attributes are wanted in
 * response object on top of default `webout` object.
 * Full functionality is not built yet, currently only supported attribute is `log`
 */
export type ExtraResponseAttributes = 'file' | 'data' | 'log'

/**
 * Represents a SASjs request parameter that will select which attributes are wanted in
 * response object on top of default `webout` object.
 * 
 * Full functionality is not built yet, currently only supported attribute is `log`
 * 
 * By default the webout object returned from SAS will be returned directly (eg res.mydata)
 * Otherwise if at least one attribute is selected, the webout object will be nested under an object named 'result' (eg res.result.mydata)
 */
export type ExtraResponseAttributes = 'file' | 'data' | 'log'

export enum SASJsFileType {
  service = 'Service',
  job = 'Job',
  test = 'Test',
  file = 'File' // Should be used when file content is not considered as Service, Job or Test and is used as raw content
}

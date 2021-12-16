export interface ResponseType {
  error : boolean;
}

export class ErrorResponse implements ResponseType {
  error : boolean = true;
  message : any;
  constructor(message : any) { this.message = message; }
}

export class RejectResponse implements ResponseType {
  error : boolean = true;
  reject : any;
  constructor(reject : any) { this.reject = reject; }
}

export class SuccessResponse implements ResponseType {
  error : boolean = false;
  data : any;
  constructor(data : any) { this.data = data; }
}

export class PromiseResponse <T> implements ResponseType {
  error : boolean = false;
  promise : Promise<T | undefined>;
  constructor(promise : Promise<T | undefined>) { this.promise = promise; }
}
export class Environment {
  public static readonly urls = JSON.parse(process.env.tsNODE_URLS!);
  public static readonly keys = JSON.parse(process.env.tsNODE_KEYS!);
}
export interface Mapper<Source, Destination> {
  toDomain(raw: Source): Destination;
  toDTO(domain: Destination): Source;
}

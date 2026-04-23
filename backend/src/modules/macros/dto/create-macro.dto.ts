export class CreateMacroDto {
  name: string;
  description?: string;
  actions: { type: string; value: string }[];
}

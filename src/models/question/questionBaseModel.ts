export abstract class BaseModel<T> {
    abstract getAllItems(page?: number, limit?: number, sort?: string): Promise<T[]>;
    abstract getItemById(id: number | string): Promise<T | null>;
    abstract createItem(data: any): Promise<T>;
    abstract updateItem(id: number | string, data: any): Promise<T>;
    abstract deleteItem(id: number | string): Promise<T>;
    abstract searchItems(query: string, page?: number, limit?: number): Promise<T[]>;
  }
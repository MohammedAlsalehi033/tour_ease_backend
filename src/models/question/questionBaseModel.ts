export abstract class BaseModel<T> {
    abstract getAllItems(page?: number, limit?: number, sort?: string): Promise<T[]>;
    abstract getItemById(id: number | string): Promise<T | null>;
    abstract createItem(data: any): Promise<T>;
    abstract updateItem( id: number | string,
      questionId: number,
      description: string,
      tags: string[],
      userId: string): Promise<T>;
    abstract deleteItem(id: number | string): Promise<T>;
    abstract searchItems(query: string, page?: number, limit?: number): Promise<T[]>;
  }
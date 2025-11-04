export abstract class BaseReviewModel<T> {
    abstract getAllItems(page?: number, limit?: number, sort?: string): Promise<T[]>;
    abstract getItemById(id: number | string): Promise<T | null>;
    abstract createItem(data: any): Promise<T>;
    abstract updateItem(id: number | string, data: any): Promise<T>;
    abstract deleteItem(id: number | string): Promise<T>;
    abstract searchItems(query: string, page?: number, limit?: number): Promise<T[]>;
    abstract getReviewsByReviewableType(reviewableType: string, reviewableId: number, page?: number, limit?: number): Promise<T[]>;
    abstract getReviewsByReviewer(reviewerId: string, page?: number, limit?: number): Promise<T[]>;
    abstract getAverageRating(reviewableType: string, reviewableId: number): Promise<number>;
    abstract getReviewStats(reviewableType: string, reviewableId: number): Promise<any>;
}

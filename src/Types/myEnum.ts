export enum UserRole {
    ADMIN = "admin",
    TRAVELER = "traveler",
    TRANSPORTATION_PROVIDER = "transportationProvider",
    ACCOMMODATION_PROVIDER = "accommodationProvider",
}

export enum ReviewableType {
    TRANSPORTATION_LISTING = "TRANSPORTATION_LISTING",
    ACCOMMODATION = "ACCOMMODATION",
    ROOM = "ROOM",
    TRANSPORTATION_BOOKING = "TRANSPORTATION_BOOKING",
    ACCOMMODATION_BOOKING = "ACCOMMODATION_BOOKING",
}

export enum ReviewSortType {
    NEWEST = "newest",
    OLDEST = "oldest",
    HIGHEST_RATING = "highest_rating",
    LOWEST_RATING = "lowest_rating",
}
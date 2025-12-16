# Reviews Components

A complete review system for properties and services with rating, photos, helpful votes, owner replies, and reporting functionality.

## Components

### ReviewsList (Main Component)

The complete review system including rating summary, distribution charts, filters, and review list.

#### Usage

```tsx
import { ReviewsList } from '@/components/reviews';

function PropertyDetailPage({ propertyId }: { propertyId: string }) {
  return (
    <div>
      {/* ... property details ... */}

      <ReviewsList
        itemType="property"
        itemId={propertyId}
        itemTitle="Luxury Apartment in Downtown"
      />
    </div>
  );
}
```

#### Props

- `itemType`: `'property' | 'service'` - Type of item being reviewed
- `itemId`: `string` - ID of the property or service
- `itemTitle`: `string` (optional) - Display name for the modal

### ReviewForm

A button that opens a modal for submitting reviews.

#### Usage

```tsx
import { ReviewForm } from '@/components/reviews';

function MyComponent() {
  return (
    <ReviewForm
      itemType="service"
      itemId="123456"
      itemTitle="House Cleaning Service"
      onSuccess={() => console.log('Review submitted!')}
    />
  );
}
```

#### Props

- `itemType`: `'property' | 'service'` - Type of item being reviewed
- `itemId`: `string` - ID of the property or service
- `itemTitle`: `string` (optional) - Display name for the modal
- `onSuccess`: `() => void` (optional) - Callback when review is submitted successfully

#### Features

- Star rating (1-5, half stars allowed)
- Text review with character count (min 10, max 1000 characters)
- Photo upload (up to 5 images)
- Authentication check - only logged-in users can review
- Form validation

### ReviewCard

Displays an individual review with user info, rating, text, photos, and actions.

#### Usage

```tsx
import { ReviewCard } from '@/components/reviews';

function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  return (
    <div>
      {reviews.map((review) => (
        <ReviewCard
          key={review._id}
          review={review}
          onUpdate={() => fetchReviews()}
          showOwnerReply={true}
        />
      ))}
    </div>
  );
}
```

#### Props

- `review`: `Review` - Review object from API
- `onUpdate`: `() => void` (optional) - Callback when review is updated/deleted
- `showOwnerReply`: `boolean` (default: true) - Whether to show owner's response

#### Features

- User avatar and name
- Star rating display
- Review text and timestamp
- Photo gallery (if photos attached)
- Helpful voting (like/unlike)
- Owner reply display
- Delete (for own reviews)
- Report functionality (for other users' reviews)

## API Service

The review components use the `reviewsApi` service from `@/services/api/reviews.api.ts`

### Available Endpoints

```typescript
// Create a review
await reviewsApi.create({
  itemType: 'property',
  itemId: '123',
  rating: 5,
  text: 'Great property!',
  photos: ['url1', 'url2']
});

// Get reviews for an item
const { data } = await reviewsApi.getByItem('property', '123', {
  page: 1,
  limit: 10,
  sortBy: 'recent',
  rating: 5
});

// Get average rating
const { data } = await reviewsApi.getAverageRating('property', '123');

// Mark as helpful
await reviewsApi.markAsHelpful('reviewId');

// Report a review
await reviewsApi.reportReview('reviewId', { reason: 'Spam' });

// Delete a review
await reviewsApi.delete('reviewId');
```

## Authentication

All review components check for user authentication:

- Users must be logged in to submit reviews
- Users must be logged in to mark reviews as helpful
- Users can only delete their own reviews
- Users cannot report their own reviews

## Styling

Components use Ant Design's styling system and are fully responsive. All components support dark mode if enabled in your Ant Design theme.

## Examples

### Example 1: Property Detail Page

```tsx
import { ReviewsList } from '@/components/reviews';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container">
      <PropertyDetails id={params.id} />
      <ReviewsList
        itemType="property"
        itemId={params.id}
        itemTitle="Property Name"
      />
    </div>
  );
}
```

### Example 2: Service Detail Page

```tsx
import { ReviewsList } from '@/components/reviews';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container">
      <ServiceDetails id={params.id} />
      <ReviewsList
        itemType="service"
        itemId={params.id}
        itemTitle="Service Name"
      />
    </div>
  );
}
```

### Example 3: Standalone Review Form

```tsx
import { ReviewForm } from '@/components/reviews';

export default function MyBookingsPage() {
  return (
    <div>
      <h2>Leave a Review</h2>
      <ReviewForm
        itemType="property"
        itemId="abc123"
        onSuccess={() => {
          message.success('Thank you for your review!');
          router.push('/my-reviews');
        }}
      />
    </div>
  );
}
```

## Backend Requirements

Ensure your backend has the following endpoints:

- `POST /reviews` - Create review
- `GET /reviews/item/:itemType/:itemId` - Get reviews for item
- `GET /reviews/average/:itemType/:itemId` - Get average rating
- `GET /reviews/distribution/:itemType/:itemId` - Get rating distribution
- `POST /reviews/:id/helpful` - Mark as helpful
- `POST /reviews/:id/report` - Report review
- `DELETE /reviews/:id` - Delete review
- `PATCH /reviews/:id` - Update review

## TypeScript Types

```typescript
interface Review {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  itemType: 'property' | 'service';
  itemId: string;
  rating: number;
  text: string;
  photos?: string[];
  ownerReply?: string;
  ownerReplyAt?: string;
  helpfulBy: string[];
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}
```

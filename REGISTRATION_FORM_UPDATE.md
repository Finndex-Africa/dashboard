# Updated Registration Form

## Changes Made:
1. ✅ **Removed "Landlord" option** - Not in new business model
2. ✅ **Added Referral Code field** - Optional field for users to enter referral codes
3. ✅ **Updated User Types** to match new business model

---

## New User Types (3 options):

1. **Home Seeker** - Looking for properties/services
2. **Agent** - Real estate agents who list properties (gets 90% commission)
3. **Service Provider** - Offers services (cleaning, plumbing, etc.)

---

## HTML Form Structure

```html
<form action="/api/auth/register" method="POST">
  <!-- User Type Dropdown -->
  <div class="form-group">
    <label>User Type</label>
    <select name="userType" required>
      <option value="">Select user type</option>
      <option value="home_seeker">Home Seeker</option>
      <option value="agent">Agent</option>
      <option value="service_provider">Service Provider</option>
    </select>
  </div>

  <!-- Name Fields -->
  <div class="form-row">
    <div class="form-group">
      <label>First Name</label>
      <input
        type="text"
        name="firstName"
        placeholder="First name"
        required
      />
    </div>

    <div class="form-group">
      <label>Last Name</label>
      <input
        type="text"
        name="lastName"
        placeholder="Last name"
        required
      />
    </div>
  </div>

  <!-- Email -->
  <div class="form-group">
    <label>Email Address</label>
    <input
      type="email"
      name="email"
      placeholder="user@example.com"
      required
    />
  </div>

  <!-- Phone Number -->
  <div class="form-group">
    <label>Phone Number</label>
    <input
      type="tel"
      name="phone"
      placeholder="+250788123456"
      pattern="^\+?[1-9]\d{1,14}$"
      title="Enter phone in international format (e.g., +250788123456)"
      required
    />
    <small>Enter phone in international format (e.g., +250788123456)</small>
  </div>

  <!-- Password -->
  <div class="form-group">
    <label>Password</label>
    <input
      type="password"
      name="password"
      placeholder="••••••••"
      minlength="8"
      required
    />
  </div>

  <!-- ✨ NEW: Referral Code Field -->
  <div class="form-group">
    <label>Referral Code (Optional)</label>
    <input
      type="text"
      name="referralCode"
      placeholder="ABC12345"
      maxlength="8"
      pattern="[A-Z0-9]{8}"
      title="Enter 8-character referral code (letters and numbers)"
    />
    <small>Have a referral code? Enter it here to earn bonus points!</small>
  </div>

  <!-- Submit Button -->
  <button type="submit">Sign Up</button>
</form>
```

---

## React/Next.js Component Example

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userType: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: '', // NEW FIELD
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success! Redirect to verify email page
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      {/* User Type */}
      <div>
        <label className="block text-sm font-medium mb-1">User Type</label>
        <select
          value={formData.userType}
          onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select user type</option>
          <option value="home_seeker">Home Seeker</option>
          <option value="agent">Agent</option>
          <option value="service_provider">Service Provider</option>
        </select>
      </div>

      {/* First Name & Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email Address</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+250788123456"
          pattern="^\+?[1-9]\d{1,14}$"
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
        <small className="text-gray-500">
          Enter phone in international format (e.g., +250788123456)
        </small>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          minLength={8}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* ✨ NEW: Referral Code */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Referral Code (Optional)
        </label>
        <input
          type="text"
          value={formData.referralCode}
          onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
          placeholder="ABC12345"
          maxLength={8}
          pattern="[A-Z0-9]{8}"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <small className="text-gray-500">
          Have a referral code? Enter it here to earn bonus points!
        </small>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <a href="/sign-in" className="text-blue-600 hover:underline">
          Sign In
        </a>
      </p>
    </form>
  );
}
```

---

## API Request Example

When the form is submitted, it sends this JSON to `/api/auth/register`:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "phone": "+250788123456",
  "userType": "home_seeker",
  "firstName": "John",
  "lastName": "Doe",
  "referralCode": "ABC12345"
}
```

---

## Backend Processing

The backend (`auth.service.ts`) now:
1. Creates the user account
2. If `referralCode` is provided:
   - Validates the code
   - Creates referral relationship
   - Awards points to both referrer and referee

---

## Testing the Referral Flow

### Step 1: User A generates referral code
```bash
GET /api/referrals/my-code
Authorization: Bearer user_a_token

Response:
{
  "code": "ABC12345"
}
```

### Step 2: User B signs up with the code
```bash
POST /api/auth/register
{
  "email": "userb@example.com",
  "password": "password123",
  "phone": "+250788123457",
  "userType": "home_seeker",
  "firstName": "Jane",
  "lastName": "Smith",
  "referralCode": "ABC12345"  # User A's code
}
```

### Step 3: Verify referral was created
```bash
# User A checks their referrals
GET /api/referrals
Authorization: Bearer user_a_token

Response:
{
  "data": [
    {
      "refereeId": "userb_id",
      "status": "pending",
      "referrerReward": 500,
      "refereeReward": 200
    }
  ]
}
```

---

## Form Validation Rules

| Field | Required | Validation |
|-------|----------|-----------|
| User Type | Yes | Must be one of: `home_seeker`, `agent`, `service_provider` |
| First Name | Yes | String |
| Last Name | Yes | String |
| Email | Yes | Valid email format |
| Phone | Yes | International format: `+[country][number]` |
| Password | Yes | Min 8 characters |
| Referral Code | **No** | 8 characters, alphanumeric uppercase |

---

## Summary of Changes

### ✅ What Changed:
1. **Removed**: "Landlord / Agent" dropdown option
2. **Updated**: User types to 3 options (Home Seeker, Agent, Service Provider)
3. **Added**: Referral Code input field (optional)
4. **Backend**: Now processes referral codes during registration

### 📝 Notes:
- Referral code is **optional** - users can leave it blank
- Code must be exactly 8 characters (validated on backend)
- Invalid codes won't block registration - just won't apply the referral
- Users earn points when someone uses their code and completes first booking

---

## Next Steps

1. Update your registration page with the new form structure
2. Test registration with and without referral codes
3. Verify referral creation in database
4. Test the complete referral flow (signup → first booking → points awarded)

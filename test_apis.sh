#!/bin/bash
# Payment & Accommodation Dashboard API - Testing Commands

# Base URL (update with your actual backend URL)
BASE_URL="http://localhost:3000"

echo "========================================="
echo "Payment & Accommodation API Test Suite"
echo "========================================="

# ========== PAYMENT API TESTS ==========

echo -e "\n\n========== PAYMENT API TESTS =========="

# 1. Create a Payment
echo -e "\n1. Create Payment:"
echo "POST /api/payments"
curl -X POST "$BASE_URL/api/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "paymentMethod": "card",
    "transactionId": "txn_test_001_'$(date +%s)'",
    "accommodationBookingId": 1,
    "status": "pending"
  }' | json_pp

# 2. Get All Payments
echo -e "\n\n2. Get All Payments (Paginated):"
echo "GET /api/payments?page=1&pageSize=10"
curl -X GET "$BASE_URL/api/payments?page=1&pageSize=10" \
  -H "Content-Type: application/json" | json_pp

# 3. Get All Payments Filtered by Status
echo -e "\n\n3. Get Completed Payments:"
echo "GET /api/payments?status=completed"
curl -X GET "$BASE_URL/api/payments?status=completed" \
  -H "Content-Type: application/json" | json_pp

# 4. Get Payments by Date Range
echo -e "\n\n4. Get Payments by Date Range:"
echo "GET /api/payments?startDate=2024-01-01&endDate=2024-12-31"
curl -X GET "$BASE_URL/api/payments?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Content-Type: application/json" | json_pp

# 5. Get Payment Summary/Statistics
echo -e "\n\n5. Get Payment Statistics:"
echo "GET /api/payments/summary/statistics"
curl -X GET "$BASE_URL/api/payments/summary/statistics" \
  -H "Content-Type: application/json" | json_pp

# 6. Get Payment by ID
echo -e "\n\n6. Get Payment by ID (replace ID with actual):"
echo "GET /api/payments/1"
curl -X GET "$BASE_URL/api/payments/1" \
  -H "Content-Type: application/json" | json_pp

# 7. Get Payment by Transaction ID
echo -e "\n\n7. Get Payment by Transaction ID:"
echo "GET /api/payments/transaction/txn_test_001"
curl -X GET "$BASE_URL/api/payments/transaction/txn_test_001" \
  -H "Content-Type: application/json" | json_pp

# 8. Get Payments for Specific Booking
echo -e "\n\n8. Get Payments for Booking ID 1:"
echo "GET /api/payments/booking/1"
curl -X GET "$BASE_URL/api/payments/booking/1" \
  -H "Content-Type: application/json" | json_pp

# 9. Update Payment Status
echo -e "\n\n9. Update Payment Status (replace ID with actual):"
echo "PATCH /api/payments/1/status"
curl -X PATCH "$BASE_URL/api/payments/1/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }' | json_pp

# 10. Delete Payment
echo -e "\n\n10. Delete Payment (replace ID with actual):"
echo "DELETE /api/payments/1"
curl -X DELETE "$BASE_URL/api/payments/1" \
  -H "Content-Type: application/json" | json_pp

# ========== ACCOMMODATION DASHBOARD API TESTS ==========

echo -e "\n\n========== ACCOMMODATION DASHBOARD API TESTS =========="

# 1. Get Accommodation Dashboard
echo -e "\n1. Get Accommodation Dashboard (replace ID with actual accommodation ID):"
echo "GET /api/accommodations/1/dashboard"
curl -X GET "$BASE_URL/api/accommodations/1/dashboard" \
  -H "Content-Type: application/json" | json_pp

# 2. Get Multiple Accommodations (assuming IDs 2, 3)
echo -e "\n\n2. Get Another Accommodation Dashboard:"
echo "GET /api/accommodations/2/dashboard"
curl -X GET "$BASE_URL/api/accommodations/2/dashboard" \
  -H "Content-Type: application/json" | json_pp

echo -e "\n\n========== TEST COMPLETE =========="
echo "All endpoints tested!"
echo ""
echo "NOTES:"
echo "- Replace BASE_URL if running on different server"
echo "- Replace IDs (1, 2, etc.) with actual IDs from your database"
echo "- Install jq for better JSON formatting: sudo apt-get install jq"
echo "- Use 'json_pp' or 'jq' for pretty printing JSON"

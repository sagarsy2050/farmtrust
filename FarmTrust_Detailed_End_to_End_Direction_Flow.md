# FarmTrust — Detailed End-to-End Direction, Flow Lines & Visual Diagrams

## Purpose

This document defines the complete end-to-end direction for the FarmTrust application, including page-to-page flow, decision points, success/error paths, customer flow, farmer flow, admin flow, marketplace categories, payment, verification, and responsive mobile/laptop behavior.

---

# 1. Master Application Flow

```text
                         FARMTRUST
                            |
                            v
                       LANDING / HOME
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
      CUSTOMER           FARMER             ADMIN
      JOURNEY            JOURNEY            JOURNEY
          |                 |                 |
          v                 v                 v
    MARKETPLACE        FARMER LOGIN       ADMIN LOGIN
          |                 |                 |
          v                 v                 v
    ALL PRODUCTS        DASHBOARD          DASHBOARD
          |                 |                 |
          v                 v                 v
    PRODUCT DETAIL     VERIFICATION         FARMERS
          |                 |                 |
          v                 v                 v
      FARM DETAIL         FARMS              FARMS
          |                 |                 |
          v                 v                 v
        CART            DOCUMENTS          DOCUMENTS
          |                 |                 |
          v                 v                 v
      CHECKOUT           PRODUCTS         VERIFICATION
          |                 |                 |
          v                 v                 v
       PAYMENT            ORDERS           PRODUCTS
          |                 |                 |
          v                 v                 v
    ORDER SUCCESS        EARNINGS           ORDERS
                            |                 |
                            v                 v
                         ANALYTICS          REPORTS
```

---

# 2. Global Direction Rule

Every page should follow:

```text
USER ENTRY
   |
   v
PAGE OBJECTIVE
   |
   v
PRIMARY INFORMATION
   |
   v
PRIMARY ACTION
   |
   v
NEXT PAGE / STATE
   |
   +----> SUCCESS
   |
   +----> ERROR
   |
   +----> EMPTY
   |
   +----> RETRY / RECOVERY
```

Every API or database action should follow:

```text
USER ACTION
   |
   v
REQUEST
   |
   v
LOADING
   |
   +----------------+
   |                |
   v                v
SUCCESS           ERROR
   |                |
   v                v
UPDATE UI       SHOW ERROR
   |                |
   v                v
NEXT ACTION       RETRY
                     |
                     +----> REQUEST
```

---

# 3. Customer End-to-End Flow

```text
VISITOR
  |
  v
HOME
  |
  +--------------------> HOW IT WORKS
  |
  v
MARKETPLACE
  |
  v
ALL PRODUCTS
  |
  +------------+------------+------------+------------+------------+
  |            |            |            |            |
  v            v            v            v            v
 ALL       VEGETABLES     FRUITS       GRAINS       SPICES       DAIRY
  |            |            |            |            |            |
  +------------+------------+------------+------------+------------+
                               |
                               v
                         PRODUCT GRID
                               |
                               v
                        PRODUCT DETAIL
                               |
                    +----------+----------+
                    |                     |
                    v                     v
                FARM DETAIL          ADD TO CART
                    |                     |
                    +----------+----------+
                               |
                               v
                              CART
                               |
                               v
                           CHECKOUT
                               |
                               v
                         ORDER CREATION
                               |
                               v
                            PAYMENT
                          /         \
                         v           v
                     SUCCESS       FAILURE
                        |             |
                        v             v
                  ORDER SUCCESS     RETRY
                        |
                        v
                  DELIVERY / PICKUP
                        |
                        v
                    COMPLETED
```

---

# 4. Home Page

## Direction

```text
HOME
 |
 +--> HERO
 |      |
 |      +--> Browse Products --> MARKETPLACE
 |      |
 |      +--> Become a Farmer --> REGISTER
 |
 +--> Trust Section
 |
 +--> Featured Products --> PRODUCT DETAIL
 |
 +--> Featured Farms --> FARM DETAIL
 |
 +--> How It Works --> HOW IT WORKS
 |
 +--> Footer
```

## Objective

Introduce FarmTrust, communicate the trust proposition, and direct visitors into either shopping or farmer onboarding.

---

# 5. All Products / Categories

## Categories

```text
ALL
 |
 +--> VEGETABLES
 +--> FRUITS
 +--> GRAINS
 +--> SPICES
 +--> DAIRY
```

## Complete data direction

```text
ALL PRODUCTS
     |
     v
FETCH PRODUCTS
     |
     +-----------------------+
     |                       |
     v                       v
  LOADING                  ERROR
     |                       |
     v                       v
SKELETON CARDS       "Could not load products.
     |                Please refresh the page."
     v                       |
  SUCCESS                    v
     |                    [REFRESH]
     |                       |
     +-----------+-----------+
                 |
                 v
          FETCH AGAIN
```

## Success with products

```text
FETCH PRODUCTS
      |
      v
SUCCESS
      |
      v
PRODUCT COUNT
      |
   +--+--+
   |     |
   v     v
  >0     0
   |     |
   v     v
GRID   EMPTY STATE
```

## Category selection

```text
ALL PRODUCTS
     |
     v
SELECT CATEGORY
     |
 +---+---------+---------+---------+---------+
 |             |         |         |         |
 v             v         v         v         v
ALL       VEGETABLES   FRUITS    GRAINS    SPICES    DAIRY
 |             |         |         |         |         |
 +-------------+---------+---------+---------+---------+
                         |
                         v
                  FILTERED PRODUCTS
```

## Search

```text
SEARCH INPUT
     |
     v
ENTER KEYWORD
     |
     v
FILTER PRODUCTS
     |
     v
CATEGORY FILTER
     |
     v
PRODUCT RESULTS
```

---

# 6. Product Card

```text
PRODUCT CARD
    |
    +--> IMAGE
    |
    +--> PRODUCT NAME
    |
    +--> PRICE / UNIT
    |
    +--> AVAILABILITY
    |
    +--> FARMER
    |
    +--> VERIFICATION
    |
    +--> VIEW PRODUCT --> PRODUCT DETAIL
    |
    +--> ADD TO CART --> CART
```

---

# 7. Product Detail

```text
PRODUCT DETAIL
      |
      +--> Product Images
      +--> Product Name
      +--> Price
      +--> Quantity
      +--> Availability
      +--> Farmer
      +--> Farm
      +--> Verification
             |
        +----+----+
        |         |
        v         v
   VIEW FARM   ADD CART
        |         |
        v         v
   FARM DETAIL   CART
```

---

# 8. Farm Detail

```text
FARM DETAIL
    |
    +--> Farmer Information
    +--> Verification Status
    +--> Farm Location
    +--> Farm Boundary
    +--> Farm Area
    +--> Crops
    +--> Products
          |
          v
      PRODUCT DETAIL
          |
          v
       ADD TO CART
```

---

# 9. Cart

```text
PRODUCT DETAIL
      |
      v
ADD TO CART
      |
      v
CART
      |
      +--> Increase Quantity --> Recalculate
      |
      +--> Decrease Quantity --> Recalculate
      |
      +--> Remove Product --> Recalculate
      |
      +--> Checkout --> CHECKOUT
```

Empty cart:

```text
CART
 |
 +--> HAS ITEMS --> CHECKOUT
 |
 +--> EMPTY --> EMPTY CART --> BROWSE PRODUCTS
```

---

# 10. Checkout

```text
CART
 |
 v
CHECKOUT
 |
 v
CUSTOMER INFORMATION
 |
 +--> Name
 +--> Email
 +--> Phone
 |
 v
FULFILMENT
 |
 +--> DELIVERY --> ADDRESS
 |
 +--> FARM PICKUP --> FARM DETAILS
 |
 v
ORDER SUMMARY
 |
 v
CONFIRM ORDER
 |
 v
CREATE ORDER
 |
 v
PAYMENT SESSION
 |
 v
PAYMENT PROVIDER
```

---

# 11. Payment

```text
PAYMENT
   |
   v
PROCESS PAYMENT
   |
 +--+----------------+
 |                   |
 v                   v
SUCCESS             FAILURE
 |                   |
 v                   v
ORDER SUCCESS       PAYMENT ERROR
 |                   |
 v                   v
ORDER CREATED       RETRY PAYMENT
```

---

# 12. Authentication

```text
LOGIN / REGISTER
       |
       v
AUTHENTICATION
       |
   +---+---------+
   |             |
   v             v
CUSTOMER       FARMER
   |             |
   v             v
SHOP          FARMER PORTAL

ADMIN LOGIN
   |
   v
ADMIN PORTAL
```

Failed login:

```text
LOGIN
 |
 v
VALIDATE
 |
 +--> SUCCESS --> PORTAL
 |
 +--> ERROR --> ERROR MESSAGE --> RETRY
```

---

# 13. Farmer End-to-End Flow

```text
FARMER
  |
  v
REGISTER
  |
  v
LOGIN
  |
  v
FARMER DASHBOARD
  |
  v
VERIFICATION
  |
  +--> Identity
  +--> Farm
  +--> Documents
  +--> Boundary
  +--> Verification Checks
  |
 +--+---------+
 |            |
 v            v
APPROVED    FLAGGED
 |            |
 v            v
FARMS      FIX ISSUES
 |            |
 v            +----> RECHECK
ADD / EDIT FARM
 |
 v
PRODUCTS
 |
 v
CREATE PRODUCT
 |
 v
PUBLISH
 |
 v
MARKETPLACE
 |
 v
CUSTOMER ORDER
 |
 v
ORDERS
 |
 v
ACCEPT
 |
 v
PREPARE
 |
 v
DISPATCH
 |
 v
DELIVER
 |
 v
COMPLETED
 |
 v
EARNINGS
 |
 v
ANALYTICS
```

---

# 14. Farmer Verification

```text
VERIFICATION CENTER
       |
       v
IDENTITY
       |
       v
FARM INFORMATION
       |
       v
FARM BOUNDARY
       |
       v
DOCUMENTS
       |
       v
AUTOMATED CHECKS
       |
       +--> Identity
       +--> Farm
       +--> Document
       +--> Satellite Evidence
       +--> Area Match
       +--> Duplicate Check
       |
       v
FINAL REVIEW
       |
   +---+------+
   |          |
   v          v
PASS        FLAG
   |          |
   v          v
VERIFIED   FIX DATA
              |
              v
           RECHECK
              |
              +----> FINAL REVIEW
```

---

# 15. Farmer Farm Creation

```text
FARMS
 |
 v
ADD FARM
 |
 v
FARM INFORMATION
 |
 v
LOCATION
 |
 v
MAP
 |
 v
DRAW BOUNDARY
 |
 v
CALCULATE AREA
 |
 v
CROPS
 |
 v
SAVE
 |
 v
VERIFICATION
```

---

# 16. Farmer Documents

```text
DOCUMENTS
   |
   v
REQUIRED DOCUMENTS
   |
   v
UPLOAD
   |
   v
VALIDATE FILE
   |
 +--+---------+
 |            |
 v            v
VALID       INVALID
 |            |
 v            v
UPLOAD      ERROR
 |            |
 v            v
PENDING     RETRY
 |
 v
ADMIN REVIEW
 |
 +--> APPROVED
 |
 +--> REJECTED --> REVIEW NOTES --> REUPLOAD
```

---

# 17. Farmer Products

```text
PRODUCTS
   |
   v
ADD PRODUCT
   |
   v
SELECT FARM
   |
   v
PRODUCT DETAILS
   |
   +--> Name
   +--> Category
   +--> Price
   +--> Unit
   +--> Quantity
   +--> Harvest
   +--> Fulfilment
   |
   v
SAVE DRAFT
   |
   v
PUBLISH
   |
   v
MARKETPLACE
   |
   +--> Update Stock
   +--> Sold Out
   +--> Archive
```

---

# 18. Farmer Orders

```text
NEW ORDER
    |
    v
PAYMENT STATUS
    |
    v
ACCEPT
    |
    v
PREPARING
    |
    v
DISPATCHED
    |
    v
DELIVERED
    |
    v
COMPLETED
```

Exception paths:

```text
ORDER
 |
 +--> PAYMENT FAILED
 |
 +--> CANCELLED
```

---

# 19. Farmer Earnings

```text
ORDERS
  |
  v
PAYMENT DATA
  |
  v
COMPLETED / PAID ORDERS
  |
  v
EARNINGS CALCULATION
  |
  +--> Today's Sales
  +--> Total Earnings
  +--> Pending Settlement
  +--> Quantity Sold
  +--> Order Count
  |
  v
EARNINGS
  |
  v
ANALYTICS
```

---

# 20. Admin End-to-End Flow

```text
ADMIN LOGIN
    |
    v
ADMIN DASHBOARD
    |
    +--> FARMERS --> FARMER REVIEW --> VERIFICATION
    |
    +--> FARMS --> FARM REVIEW
    |
    +--> DOCUMENTS --> DOCUMENT REVIEW
    |
    +--> VERIFICATION --> APPROVE / FLAG
    |
    +--> PRODUCTS --> MODERATION
    |
    +--> ORDERS --> MONITORING
    |
    +--> REPORTS --> PLATFORM INSIGHTS
```

---

# 21. Admin Verification

```text
VERIFICATION QUEUE
      |
      v
SELECT CASE
      |
      v
REVIEW FARMER
      |
      v
REVIEW FARM
      |
      v
REVIEW DOCUMENTS
      |
      v
REVIEW CHECK RESULTS
      |
      v
FINAL DECISION
      |
   +--+------+
   |         |
   v         v
APPROVE    FLAG
   |         |
   v         v
VERIFIED   REASON
             |
             v
          FARMER FIX
             |
             v
           RECHECK
```

---

# 22. Admin Product Moderation

```text
PRODUCT QUEUE
     |
     v
SEARCH / FILTER
     |
     v
PRODUCT DETAIL
     |
     +--> Farmer
     +--> Farm
     +--> Price
     +--> Stock
     +--> Status
     |
     v
ADMIN ACTION
     |
   +--+------+
   |         |
   v         v
ALLOW      ARCHIVE
   |
   v
MARKETPLACE
```

---

# 23. Admin Orders

```text
ALL ORDERS
   |
   v
SEARCH / FILTER
   |
   v
ORDER DETAIL
   |
   +--> Customer
   +--> Farmer
   +--> Products
   +--> Amount
   +--> Payment
   +--> Delivery
   |
   v
MONITOR
   |
   v
REPORTS
```

---

# 24. Admin Reports

```text
PLATFORM DATA
      |
      +--> Users
      +--> Farmers
      +--> Farms
      +--> Products
      +--> Orders
      +--> Revenue
            |
            v
         REPORTS
            |
            +--> Overview
            +--> Revenue
            +--> Orders
            +--> Monthly Performance
            +--> Growth
```

---

# 25. Complete Marketplace Direction

```text
HOME
 |
 v
MARKETPLACE
 |
 v
ALL PRODUCTS
 |
 +--> ALL
 +--> VEGETABLES
 +--> FRUITS
 +--> GRAINS
 +--> SPICES
 +--> DAIRY
 |
 v
SEARCH / FILTER
 |
 v
PRODUCT GRID
 |
 v
PRODUCT DETAIL
 |
 +--> VIEW FARM --> FARM DETAIL
 |
 +--> ADD TO CART
          |
          v
         CART
          |
          v
       CHECKOUT
          |
          v
        PAYMENT
          |
          v
     ORDER SUCCESS
```

---

# 26. Complete Trust Loop

```text
FARMER
  |
  v
IDENTITY
  |
  v
FARM
  |
  v
BOUNDARY
  |
  v
DOCUMENTS
  |
  v
VERIFICATION
  |
  v
VERIFIED FARMER
  |
  v
VERIFIED FARM
  |
  v
PRODUCT
  |
  v
CUSTOMER
  |
  v
PURCHASE
  |
  v
FULFILMENT
  |
  v
TRUSTED FARM-TO-CUSTOMER LOOP
```

---

# 27. Responsive Mobile Direction

The mobile app uses the same business flow.

```text
MOBILE
  |
  v
HEADER
  |
  v
MENU / DRAWER
  |
  v
PAGE
  |
  v
PRIMARY ACTION
  |
  v
NEXT PAGE
```

Mobile layout rules:

```text
NO HORIZONTAL PAGE OVERFLOW
        |
        v
SINGLE-COLUMN FORMS
        |
        v
RESPONSIVE PRODUCT CARDS
        |
        v
CATEGORY SCROLL / WRAP
        |
        v
SIDEBAR --> DRAWER
        |
        v
TABLE --> RESPONSIVE CARD / CONTAINER
        |
        v
RESPONSIVE MAP
        |
        v
RESPONSIVE DIALOG
```

---

# 28. Responsive Laptop / Desktop Direction

```text
DESKTOP
  |
  v
HEADER + SIDEBAR
  |
  v
CONTENT AREA
  |
  v
MULTI-COLUMN LAYOUT
  |
  v
PRIMARY ACTION
  |
  v
NEXT PAGE
```

Desktop may show more information simultaneously, but must use the same business logic as mobile.

---

# 29. Mobile and Laptop Must Follow the Same Journey

```text
                 FARMTRUST FLOW
                       |
            +----------+----------+
            |                     |
            v                     v
         MOBILE                LAPTOP
            |                     |
            v                     v
      RESPONSIVE UI        RESPONSIVE UI
            |                     |
            +----------+----------+
                       |
                       v
                  SAME DATA
                       |
                       v
              SAME BUSINESS LOGIC
                       |
                       v
                SAME USER JOURNEY
```

---

# 30. Global Error Direction

```text
USER ACTION
    |
    v
REQUEST
    |
    v
LOADING
    |
 +--+-----------+
 |              |
 v              v
SUCCESS        ERROR
 |              |
 v              v
UPDATE UI     ERROR MESSAGE
 |              |
 v              v
NEXT ACTION   RETRY
                 |
                 +----> REQUEST
```

---

# 31. Product Loading Error — Required Behavior

```text
ALL PRODUCTS
      |
      v
FETCH PRODUCTS
      |
      v
LOADING
      |
 +----+-----+
 |          |
 v          v
SUCCESS    FAILURE
 |          |
 v          v
PRODUCTS   "Could not load products.
 |           Please refresh the page."
 |                     |
 v                     v
SHOW GRID             [REFRESH]
                       |
                       v
                  FETCH AGAIN
```

Do not show an empty-state message when the API/database request failed.

Use:

```text
REQUEST FAILED
    =
ERROR STATE
```

Use:

```text
REQUEST SUCCEEDED + ZERO RESULTS
    =
EMPTY STATE
```

---

# 32. Global Navigation

```text
PUBLIC
 |
 +--> Home
 +--> Marketplace
 +--> How It Works
 +--> Login
 +--> Register

CUSTOMER
 |
 +--> Marketplace
 +--> Product Detail
 +--> Farm Detail
 +--> Cart
 +--> Checkout
 +--> Order Success

FARMER
 |
 +--> Dashboard
 +--> Verification
 +--> Farms
 +--> Documents
 +--> Products
 +--> Orders
 +--> Earnings
 +--> Analytics

ADMIN
 |
 +--> Dashboard
 +--> Farmers
 +--> Farms
 +--> Documents
 +--> Verification
 +--> Products
 +--> Orders
 +--> Reports
```

---

# 33. Final End-to-End Direction

```text
                           FARMTRUST
                              |
                              v
                             HOME
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
       CUSTOMER             FARMER              ADMIN
          |                   |                   |
          v                   v                   v
     MARKETPLACE          REGISTER / LOGIN      LOGIN
          |                   |                   |
          v                   v                   v
    ALL PRODUCTS          DASHBOARD           DASHBOARD
          |                   |                   |
          v                   v                   v
 CATEGORIES / SEARCH      VERIFICATION        MANAGEMENT
          |                   |                   |
          v                   v                   v
     PRODUCT DETAIL         FARM SETUP         REVIEW
          |                   |                   |
          v                   v                   v
      FARM DETAIL         DOCUMENTS           APPROVAL
          |                   |                   |
          v                   v                   v
         CART              PRODUCTS            PRODUCTS
          |                   |                   |
          v                   v                   v
       CHECKOUT             ORDERS              ORDERS
          |                   |                   |
          v                   v                   v
       PAYMENT             EARNINGS             REPORTS
          |                   |
          v                   v
    ORDER SUCCESS         ANALYTICS
          |
          v
    DELIVERY / PICKUP
          |
          v
       COMPLETED
```

---

# 34. Implementation Checklist

## Customer

- [ ] Home
- [ ] Marketplace
- [ ] All Products
- [ ] Vegetables
- [ ] Fruits
- [ ] Grains
- [ ] Spices
- [ ] Dairy
- [ ] Search
- [ ] Product Detail
- [ ] Farm Detail
- [ ] Cart
- [ ] Checkout
- [ ] Payment
- [ ] Order Success

## Authentication

- [ ] Login
- [ ] Register
- [ ] Forgot Password
- [ ] Protected Routes
- [ ] Role-Based Redirect

## Farmer

- [ ] Dashboard
- [ ] Verification
- [ ] Farms
- [ ] Farm Editor
- [ ] Documents
- [ ] Products
- [ ] Orders
- [ ] Earnings
- [ ] Analytics

## Admin

- [ ] Dashboard
- [ ] Farmers
- [ ] Farms
- [ ] Documents
- [ ] Verification
- [ ] Products
- [ ] Orders
- [ ] Reports

## UI States

- [ ] Loading
- [ ] Success
- [ ] Empty
- [ ] Error
- [ ] Retry
- [ ] Validation
- [ ] Confirmation
- [ ] Unauthorized
- [ ] Not Found

## Responsive

- [ ] Mobile
- [ ] Tablet
- [ ] Laptop
- [ ] Desktop
- [ ] No horizontal overflow
- [ ] Touch-friendly controls
- [ ] Responsive navigation
- [ ] Responsive tables
- [ ] Responsive maps
- [ ] Responsive charts

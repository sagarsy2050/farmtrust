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


---

# 37. Live Metro City Market Price / Trade Value System

## Objective

Add a live/latest market-price layer to FarmTrust so customers and farmers can see the latest available agricultural market value for supported commodities, normalized to **₹/kg**.

The source should be treated as market-reference data, not as a guaranteed FarmTrust selling price.

The initial reference source for the specification is **AGMARKNET / Government of India market data**. AGMARKNET provides market price and arrival information, including minimum, maximum and modal prices, and covers a large network of agricultural markets. The portal currently exposes a Daily Price and Arrival Report. 

### Important terminology

Use:

```text
Latest Market Price
Latest Available Market Data
Market Reference Price
```

Do not label a daily market feed as:

```text
Second-by-second Live Price
Guaranteed Selling Price
Guaranteed Farmer Price
```

The UI must show the actual **last updated date/time** received from the source.

---

# 38. Metro City Price Coverage

The application should support a configurable list of metro-city regions rather than hard-coding one market per city.

```text
METRO CITY
    |
    v
CITY / REGION MAPPING
    |
    v
SUPPORTED APMC / MARKET YARDS
    |
    v
COMMODITY + VARIETY
    |
    v
LATEST MARKET RECORDS
```

Example configuration:

```text
Ahmedabad
Mumbai
Delhi NCR
Bengaluru
Hyderabad
Chennai
Kolkata
Pune
+ additional supported metro regions
```

The actual market yards attached to each metro region must come from the configured market master/source data. Do not assume that a city name is itself an APMC market.

---

# 39. Commodity Coverage

The price module must connect to the existing FarmTrust product categories:

```text
ALL
 |
 +--> VEGETABLES
 |      +--> Tomato
 |      +--> Potato
 |      +--> Onion
 |      +--> Other configured vegetables
 |
 +--> FRUITS
 |      +--> Mango
 |      +--> Banana
 |      +--> Other configured fruits
 |
 +--> GRAINS
 |      +--> Rice
 |      +--> Wheat
 |      +--> Other configured grains
 |
 +--> SPICES
 |      +--> Chilli
 |      +--> Turmeric
 |      +--> Other configured spices
 |
 +--> DAIRY
        +--> Configured dairy commodities
```

The commodity list must be data-driven.

Do not create a permanent hard-coded list of prices in the frontend.

---

# 40. Live Market Price Page

## Page name

**Live Market Prices**

## Primary objective

Allow a user to:

1. Select a metro city/region.
2. Select a category.
3. Select a commodity.
4. See the latest available market records.
5. Compare minimum, modal and maximum prices.
6. See the market/mandi and variety.
7. See arrivals when available.
8. See exactly when the record was updated.
9. Understand that the value is a market reference rather than a guaranteed FarmTrust selling price.

---

# 41. Live Market Price Page Layout

```text
+------------------------------------------------------+
| FARMTRUST HEADER                                     |
+------------------------------------------------------+
| LIVE MARKET PRICES                                   |
|                                                      |
| [ City / Region v ]                                  |
| [ Category v ]       [ Commodity v ]                |
| [ Market / Mandi v ] [ Variety v ]                  |
|                                                      |
| Last updated: DD MMM YYYY, HH:MM                     |
+------------------------------------------------------+
|                                                      |
| TOMATO                                               |
| Ahmedabad Market                                     |
|                                                      |
| Minimum       Modal / Reference       Maximum        |
| ₹ XX/kg       ₹ XX/kg                ₹ XX/kg        |
|                                                      |
| Arrival: XXXXX                                       |
| Variety: XXXXX                                       |
|                                                      |
| [ View Price History ]                               |
+------------------------------------------------------+
```

---

# 42. Price Data Flow

```text
GOVERNMENT / MARKET DATA SOURCE
              |
              v
       INGESTION SERVICE
              |
              v
        SOURCE VALIDATION
              |
              v
       MARKET MAPPING
              |
              v
     COMMODITY NORMALIZATION
              |
              v
        UNIT NORMALIZATION
              |
              v
       PRICE CALCULATION
              |
              v
       DATA QUALITY CHECK
              |
              v
          CACHE / DB
              |
              v
        FARMTRUST API
              |
       +------+------+
       |             |
       v             v
    MOBILE        LAPTOP
       |             |
       +------+------+
              |
              v
       LIVE MARKET UI
```

---

# 43. Source Data Model

The ingestion layer should preserve the original source values before normalization.

```text
MarketPriceSourceRecord
 |
 +--> source_name
 +--> source_record_id
 +--> source_date
 +--> source_updated_at
 +--> state
 +--> district
 +--> market
 +--> commodity
 +--> variety
 +--> grade
 +--> min_price
 +--> max_price
 +--> modal_price
 +--> price_unit
 +--> arrival_quantity
 +--> arrival_unit
 +--> raw_payload_reference
 +--> fetched_at
```

Preserving the source record allows FarmTrust to audit how the displayed reference price was produced.

---

# 44. FarmTrust Normalized Price Model

```text
MarketPrice
 |
 +--> id
 +--> city_region_id
 +--> state
 +--> district
 +--> market_id
 +--> market_name
 +--> commodity_id
 +--> commodity_name
 +--> category
 +--> variety
 +--> grade
 +--> source_name
 +--> source_record_id
 +--> source_date
 +--> source_updated_at
 +--> min_price_source
 +--> modal_price_source
 +--> max_price_source
 +--> source_unit
 +--> min_price_kg
 +--> modal_price_kg
 +--> max_price_kg
 +--> arrival_quantity
 +--> arrival_unit
 +--> fetched_at
 +--> normalized_at
 +--> status
```

---

# 45. ₹/kg Normalization

The application must not blindly assume that every source price is already per kilogram.

```text
SOURCE PRICE
    |
    v
SOURCE UNIT
    |
    v
UNIT CONVERSION RULE
    |
    v
NORMALIZED PRICE
    |
    v
₹ / KG
```

Use a unit-conversion service:

```text
convertToKg(
    sourcePrice,
    sourceUnit,
    conversionRule
)
```

Example concept:

```text
If source unit = kg
    normalized = source price

If source unit = quintal
    normalized = source price / 100

If source unit = tonne
    normalized = source price / 1000
```

The conversion table must be centrally configured and versioned.

Do not infer an unknown unit.

If no trusted conversion exists:

```text
NORMALIZATION FAILED
        |
        v
DO NOT DISPLAY ₹/KG
        |
        v
SHOW SOURCE UNIT
        |
        v
FLAG DATA FOR REVIEW
```

---

# 46. Minimum / Modal / Maximum Price

The UI should distinguish:

```text
MINIMUM PRICE
    |
    v
LOWEST REPORTED MARKET VALUE

MODAL PRICE
    |
    v
PRIMARY MARKET REFERENCE VALUE

MAXIMUM PRICE
    |
    v
HIGHEST REPORTED MARKET VALUE
```

Display:

```text
Minimum: ₹XX/kg
Modal:   ₹XX/kg
Maximum: ₹XX/kg
```

Do not calculate a fake "average price" unless the source provides sufficient data for a valid weighted calculation.

---

# 47. Price Validation

Before publishing a normalized record:

```text
MIN
 |
 v
MODAL
 |
 v
MAX
```

Expected relationship:

```text
min_price <= modal_price <= max_price
```

If invalid:

```text
INVALID SOURCE RECORD
       |
       v
QUARANTINE RECORD
       |
       v
DO NOT PUBLISH
       |
       v
LOG VALIDATION ERROR
```

The AGMARKNET data-entry documentation describes validation of minimum, modal and maximum price relationships, so FarmTrust should preserve a similar validation rule in its normalization pipeline.

---

# 48. Market Mapping

```text
USER SELECTS CITY
       |
       v
CITY REGION
       |
       v
MARKET MASTER
       |
       v
MATCHED MARKET YARDS
       |
       v
PRICE RECORDS
```

Example:

```text
Ahmedabad
   |
   +--> Market A
   +--> Market B
   +--> Market C
```

Do not merge markets into one number without a defined aggregation rule.

If multiple markets exist:

```text
CITY
 |
 +--> MARKET 1 --> PRICE
 |
 +--> MARKET 2 --> PRICE
 |
 +--> MARKET 3 --> PRICE
```

Optionally provide:

```text
[All Markets]
```

with an explicit aggregation method.

---

# 49. Price Aggregation

If the user selects:

```text
City = Ahmedabad
Market = All Markets
Commodity = Tomato
```

the system should return individual market records first.

```text
Ahmedabad
 |
 +--> Market A --> ₹XX/kg
 +--> Market B --> ₹XX/kg
 +--> Market C --> ₹XX/kg
```

If a city-level summary is required, the backend must explicitly define the method:

```text
CITY SUMMARY
 |
 +--> Market count
 +--> Lowest modal price
 +--> Highest modal price
 +--> Weighted reference price (only if valid arrival weights exist)
 +--> Last updated
```

Never silently average unrelated market prices.

---

# 50. Live Price API

Recommended API structure:

```text
GET /api/market-prices
```

Query parameters:

```text
city_region
category
commodity
market
variety
date
```

Example response structure:

```json
{
  "source": "AGMARKNET",
  "lastUpdated": "2026-08-17T...",
  "currency": "INR",
  "unit": "kg",
  "records": [
    {
      "cityRegion": "Ahmedabad",
      "market": "Market Name",
      "commodity": "Tomato",
      "category": "Vegetables",
      "variety": "Variety",
      "minPriceKg": 0,
      "modalPriceKg": 0,
      "maxPriceKg": 0,
      "arrivalQuantity": 0,
      "arrivalUnit": "source-unit"
    }
  ]
}
```

Do not put secret source credentials in the frontend.

---

# 51. Backend Synchronization

Recommended flow:

```text
SCHEDULED JOB
     |
     v
FETCH LATEST SOURCE DATA
     |
     v
VALIDATE RESPONSE
     |
     v
NORMALIZE
     |
     v
DEDUPLICATE
     |
     v
STORE RAW RECORD
     |
     v
STORE NORMALIZED RECORD
     |
     v
UPDATE CACHE
     |
     v
API AVAILABLE
```

Use a backend scheduler/worker rather than making every customer device directly call the external market-data source.

---

# 52. Refresh Strategy

The system must support configurable synchronization.

```text
SOURCE DATA AVAILABLE
        |
        v
SYNC JOB
        |
        v
DATABASE
        |
        v
CACHE
        |
        v
CUSTOMER REQUEST
```

Recommended controls:

```text
SYNC_INTERVAL
SOURCE_DATE
FETCHED_AT
SOURCE_UPDATED_AT
CACHE_EXPIRES_AT
```

The exact polling frequency should be configurable based on source terms, source update frequency and system load.

Do not claim second-by-second updates when the source is daily.

---

# 53. Stale Data Protection

Every record should have freshness information.

```text
CURRENT
   |
   v
DISPLAY NORMAL

STALE
   |
   v
DISPLAY WARNING

TOO OLD / INVALID
   |
   v
DO NOT PRESENT AS CURRENT
```

Example:

```text
Market reference
₹XX/kg

Last updated:
17 Aug 2026, 10:30 AM

Status:
Latest available
```

If stale:

```text
₹XX/kg

Last updated:
15 Aug 2026

⚠ Market data may be outdated.
```

---

# 54. Source Failure

```text
SCHEDULED SYNC
      |
      v
SOURCE REQUEST
      |
   +--+------+
   |         |
   v         v
SUCCESS    FAILURE
   |         |
   v         v
UPDATE     KEEP LAST
DATA       VERIFIED DATA
   |         |
   v         v
CACHE      MARK STALE
             |
             v
        SHOW WARNING
```

The customer should not see a false "live" price when the source has stopped updating.

---

# 55. API Error State

```text
LIVE MARKET PAGE
      |
      v
REQUEST
      |
      v
ERROR
      |
      v
Could not load market prices.
      |
      +--> [Retry]
      |
      +--> [View Last Available]
```

If last-known data is shown:

```text
Last available market data
Not current
Updated: DD MMM YYYY HH:MM
```

---

# 56. Empty Market Data

```text
CITY + COMMODITY
      |
      v
NO RECORDS
      |
      v
No market price is available
for this selection.
      |
      +--> Change Market
      +--> Change Commodity
      +--> View Other Cities
```

Do not display `₹0/kg` for missing data.

---

# 57. Price History

Each commodity should optionally support:

```text
TODAY
7 DAYS
30 DAYS
90 DAYS
```

Flow:

```text
CURRENT PRICE
     |
     v
VIEW PRICE HISTORY
     |
     v
SELECT PERIOD
     |
     v
PRICE HISTORY
     |
     +--> Minimum
     +--> Modal
     +--> Maximum
     +--> Market
     +--> Date
```

A history chart should clearly identify:

```text
X = Date
Y = ₹/kg
Series = selected market / commodity / variety
```

---

# 58. Customer Price Context

On Product Detail:

```text
PRODUCT
 |
 v
FARMTRUST SELLING PRICE
 |
 v
MARKET REFERENCE
 |
 +--> Nearby market
 +--> Modal market value
 +--> Min / Max
 +--> Last updated
 |
 v
CUSTOMER CONTEXT
```

Example:

```text
FarmTrust Price
₹XX/kg

Market Reference
₹YY/kg

Ahmedabad Market
Last updated: DD MMM YYYY HH:MM

Market range
₹AA – ₹BB/kg
```

The market reference must never automatically overwrite the farmer's configured selling price.

---

# 59. Farmer Price Context

On the farmer product editor:

```text
FARMER PRODUCT
      |
      v
SELECT COMMODITY
      |
      v
FETCH MARKET REFERENCE
      |
      v
DISPLAY MARKET CONTEXT
      |
      +--> Min
      +--> Modal
      +--> Max
      +--> Market
      +--> Last updated
      |
      v
FARMER SETS SELLING PRICE
```

The market reference is advisory/contextual.

```text
MARKET REFERENCE != FARMTRUST SELLING PRICE
```

---

# 60. Price Comparison

```text
COMMODITY
   |
   v
SELECT CITY
   |
   v
SELECT MARKET
   |
   v
PRICE
   |
   +--> FarmTrust Price
   +--> Market Modal
   +--> Market Min
   +--> Market Max
   |
   v
CONTEXTUAL COMPARISON
```

Do not present the comparison as a recommendation to buy/sell unless a separate business rule has been defined.

---

# 61. Data Quality Pipeline

```text
SOURCE
  |
  v
SCHEMA VALIDATION
  |
  v
FIELD VALIDATION
  |
  v
MARKET VALIDATION
  |
  v
COMMODITY MAPPING
  |
  v
UNIT VALIDATION
  |
  v
PRICE RELATION VALIDATION
  |
  v
DATE VALIDATION
  |
  v
DUPLICATE CHECK
  |
  v
QUALITY SCORE
  |
 +--+---------+
 |            |
 v            v
PASS        FAIL
 |            |
 v            v
PUBLISH     QUARANTINE
```

---

# 62. Duplicate Protection

Use a source-based uniqueness key such as:

```text
source
+
source_record_id
+
source_date
```

If source_record_id is unavailable, use a carefully defined composite key based on:

```text
source
state
district
market
commodity
variety
grade
source_date
```

Do not create duplicate records every time the sync job runs.

---

# 63. Audit Trail

For every published price record store:

```text
Created
Updated
Fetched
Normalized
Published
Source
Source Record ID
Source Date
Source Unit
Normalized Unit
Conversion Rule
Validation Result
```

This makes it possible to answer:

```text
Where did this price come from?
When was it fetched?
When was it published?
How was ₹/kg calculated?
```

---

# 64. Admin Live Market Price Console

```text
ADMIN
  |
  v
MARKET DATA
  |
  +--> Source Status
  +--> Last Sync
  +--> Sync Errors
  +--> Markets
  +--> Commodities
  +--> Price Records
  +--> Stale Records
  +--> Quarantined Records
```

Admin dashboard:

```text
+------------------------------------------------------+
| LIVE MARKET DATA                                     |
+------------------------------------------------------+
| Source Status:       HEALTHY                        |
| Last Successful Sync: DD MMM YYYY HH:MM              |
| Records Updated:     XXXXX                           |
| Failed Records:      XX                              |
| Stale Records:       XX                              |
+------------------------------------------------------+
| [Sync Status] [Errors] [Markets] [Commodities]       |
+------------------------------------------------------+
```

---

# 65. Admin Manual Controls

Allowed administrative controls:

```text
[Run Sync]
[Pause Sync]
[Retry Failed]
[View Source Record]
[View Validation Error]
[Mark Mapping]
[Disable Mapping]
```

Manual price editing should be restricted and audited.

If an administrator overrides a normalized value:

```text
OVERRIDE
   |
   +--> Original Source Value
   +--> Override Value
   +--> Reason
   +--> Admin
   +--> Timestamp
   |
   v
AUDIT LOG
```

---

# 66. Market Data Security

```text
EXTERNAL SOURCE CREDENTIALS
        |
        v
BACKEND ONLY
        |
        v
SECRET MANAGER / ENVIRONMENT
        |
        v
INGESTION SERVICE
```

Never expose source API keys or credentials in:

```text
React / Next.js client bundle
Mobile application
Browser local storage
Public API response
```

The customer-facing API should expose only the normalized data required by the UI.

---

# 67. Rate Limit and Failure Protection

```text
SOURCE
  |
  v
RATE LIMIT
  |
  v
BACKOFF
  |
  v
RETRY
  |
 +--+------+
 |         |
 v         v
SUCCESS   FAIL
 |         |
 v         v
STORE     LOG
           |
           v
        ALERT ADMIN
```

Do not continuously hammer the source when it is unavailable.

---

# 68. Mobile Live Price UI

```text
+-------------------------+
| Live Market Prices      |
+-------------------------+
| City                    |
| [Ahmedabad        v]    |
+-------------------------+
| Category                |
| [Vegetables        v]   |
+-------------------------+
| Commodity               |
| [Tomato            v]   |
+-------------------------+
|                         |
| Tomato                  |
| Ahmedabad Market        |
|                         |
| Modal                   |
| ₹XX / kg                |
|                         |
| Min ₹XX  Max ₹XX        |
|                         |
| Updated: DD MMM HH:MM   |
|                         |
| [History]               |
+-------------------------+
```

Mobile requirements:

```text
No horizontal overflow
Touch-friendly selectors
Readable ₹/kg value
Visible updated time
Scrollable market list
Accessible retry button
```

---

# 69. Laptop Live Price UI

```text
+----------------------------------------------------------------+
| LIVE MARKET PRICES                                             |
+----------------------------------------------------------------+
| City        | Category     | Commodity     | Market             |
| Ahmedabad   | Vegetables   | Tomato        | All Markets        |
+----------------------------------------------------------------+
|                                                                  |
| Market       Variety       Min/kg       Modal/kg       Max/kg    |
| ---------------------------------------------------------------- |
| Market A     Variety A     ₹XX          ₹XX            ₹XX       |
| Market B     Variety B     ₹XX          ₹XX            ₹XX       |
| Market C     Variety C     ₹XX          ₹XX            ₹XX       |
|                                                                  |
| Last updated: DD MMM YYYY HH:MM                                  |
+----------------------------------------------------------------+
```

---

# 70. Live Market Price Flow — Complete

```text
USER
 |
 v
LIVE MARKET PRICES
 |
 v
SELECT CITY
 |
 v
SELECT CATEGORY
 |
 v
SELECT COMMODITY
 |
 v
SELECT MARKET
 |
 v
REQUEST FARMTRUST API
 |
 v
CACHE / DATABASE
 |
 v
LATEST SOURCE RECORD
 |
 v
VALIDATE
 |
 v
NORMALIZE TO ₹/KG
 |
 v
DISPLAY
 |
 +--> Min
 +--> Modal
 +--> Max
 +--> Market
 +--> Variety
 +--> Arrival
 +--> Last Updated
 |
 v
VIEW HISTORY
```

---

# 71. Complete Price-System Architecture

```text
                   GOVERNMENT / MARKET SOURCE
                              |
                              v
                       INGESTION WORKER
                              |
                 +------------+------------+
                 |                         |
                 v                         v
             RAW DATA                SOURCE STATUS
                 |
                 v
          NORMALIZATION
                 |
                 v
           VALIDATION
                 |
          +------+------+
          |             |
          v             v
        PASS           FAIL
          |             |
          v             v
       DATABASE      QUARANTINE
          |
          v
        CACHE
          |
          v
      FARMTRUST API
          |
     +----+----+----------------+
     |         |                |
     v         v                v
 CUSTOMER    FARMER            ADMIN
     |         |                |
     v         v                v
 MARKET      PRODUCT          DATA
 PRICE       CONTEXT          CONSOLE
```

---

# 72. Data Freshness Rules

The UI must display:

```text
SOURCE DATE
SOURCE UPDATED TIME
FARMTRUST FETCHED TIME
FARMTRUST LAST SYNC
```

Example:

```text
Market reference
₹XX/kg

Source date:
17 Aug 2026

Fetched:
17 Aug 2026, 11:05 AM

Last source update:
17 Aug 2026, 10:45 AM
```

If the source only provides a date and not a precise update time, do not invent a time.

---

# 73. Source Attribution

Every market-price view should include:

```text
Source: AGMARKNET / Government market data
```

The source attribution should be clickable in the final product where permitted.

The product specification should preserve the source name, source record identifier and source date.

---

# 74. Important Business Rules

1. **Market reference price is not FarmTrust selling price.**
2. **Never show ₹0/kg for missing data.**
3. **Never invent an update time.**
4. **Never silently convert an unknown unit.**
5. **Never call daily data second-by-second live.**
6. **Always show last updated information.**
7. **Preserve original source values.**
8. **Validate min <= modal <= max.**
9. **Do not silently average multiple markets.**
10. **Keep source credentials on the backend.**
11. **Cache source data to protect the external source and FarmTrust performance.**
12. **Keep an audit trail for normalization and overrides.**
13. **Use the same API/business logic for mobile and laptop.**
14. **Treat unavailable data, stale data, empty data and source failure as different states.**

---

# 75. Final Integrated FarmTrust Flow

```text
                              FARMTRUST
                                  |
                                  v
                                 HOME
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
         CUSTOMER              FARMER                ADMIN
             |                    |                    |
             v                    v                    v
        MARKETPLACE           DASHBOARD            DASHBOARD
             |                    |                    |
             v                    v                    v
       ALL PRODUCTS          VERIFICATION          MARKET DATA
             |                    |                    |
             v                    v                    v
      CATEGORY / SEARCH        FARMS             SOURCE STATUS
             |                    |                    |
             v                    v                    v
       PRODUCT DETAIL         PRODUCTS             MARKETS
             |                    |                    |
       +-----+-----+             v                    v
       |           |           ORDERS             PRICES
       v           v             |                    |
    FARM DETAIL  CART            v                    v
       |           |          EARNINGS           VALIDATION
       |           |                                  |
       +-----+-----+                                  v
             |                                  NORMALIZATION
             v                                       |
           CART                                      v
             |                                      ₹/KG
             v                                       |
         CHECKOUT                                    v
             |                                  FARMTRUST API
             v                                       |
          PAYMENT                          +----------+----------+
             |                             |          |          |
             v                             v          v          v
       ORDER SUCCESS                    CUSTOMER   FARMER     ADMIN
             |                             |          |          |
             v                             v          v          v
      DELIVERY / PICKUP               PRICE UI   PRICE CONTEXT  CONSOLE
             |
             v
         COMPLETED
```

---

# 76. Implementation Checklist — Live Market Prices

## Data Source

- [ ] Government/approved market data source configured
- [ ] Source attribution stored
- [ ] Source record ID stored
- [ ] Source date stored
- [ ] Source update timestamp stored when available
- [ ] Raw source record retained

## Markets

- [ ] Metro city/region master
- [ ] State mapping
- [ ] District mapping
- [ ] Market/APMC mapping
- [ ] Multiple markets per city supported

## Commodities

- [ ] Category mapping
- [ ] Commodity master
- [ ] Variety mapping
- [ ] Grade mapping
- [ ] Product-to-commodity mapping

## Prices

- [ ] Minimum price
- [ ] Modal price
- [ ] Maximum price
- [ ] Source unit
- [ ] Normalized ₹/kg
- [ ] Conversion rules
- [ ] Conversion audit

## Backend

- [ ] Ingestion worker
- [ ] Scheduler
- [ ] Validation
- [ ] Deduplication
- [ ] Cache
- [ ] API
- [ ] Retry/backoff
- [ ] Error logging
- [ ] Stale detection

## UI

- [ ] Live Market Prices page
- [ ] City selector
- [ ] Category selector
- [ ] Commodity selector
- [ ] Market selector
- [ ] Variety selector
- [ ] Min / Modal / Max
- [ ] ₹/kg display
- [ ] Last updated
- [ ] Source attribution
- [ ] Price history
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Retry state
- [ ] Stale warning

## Customer Integration

- [ ] Product detail market reference
- [ ] Farm/product context
- [ ] No automatic selling-price overwrite
- [ ] Clear market-reference label

## Farmer Integration

- [ ] Product editor market reference
- [ ] City/market context
- [ ] Min / Modal / Max
- [ ] Last updated
- [ ] Advisory-only presentation

## Admin

- [ ] Source status
- [ ] Last sync
- [ ] Failed records
- [ ] Stale records
- [ ] Quarantine records
- [ ] Manual mapping
- [ ] Audited overrides

## Responsive

- [ ] Mobile
- [ ] Tablet
- [ ] Laptop
- [ ] Desktop
- [ ] No horizontal overflow
- [ ] Same API
- [ ] Same business rules
- [ ] Same price normalization

# FarmTrust — Page Objectives, Workflows & Top-Level App Flow Diagrams

## 1. Document Purpose

This document defines the objective, primary workflow, and top-level navigation/workflow diagram for every major FarmTrust application page.

FarmTrust is a trusted farm-to-customer marketplace connecting customers with verified farmers and farms. The application contains three major experiences:

1. Public / Customer experience
2. Farmer portal
3. Admin portal

### Responsive design requirement

All pages must be implemented as **one responsive application** that works on mobile, tablet, laptop, and desktop.

Responsive behavior may change:
- navigation layout
- card/grid density
- sidebar behavior
- table presentation
- form layout
- spacing and typography

Responsive behavior must **not** change the underlying business workflow.

---

# 2. Top-Level FarmTrust App Flow

```text
                         ┌──────────────────────┐
                         │      FARMTRUST       │
                         │   HOME / LANDING     │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │    CUSTOMER    │  │     FARMER     │  │     ADMIN      │
        │  Marketplace   │  │     Portal     │  │     Portal     │
        └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
                │                   │                   │
                ▼                   ▼                   ▼
        Browse Products        Verification         Dashboard
                │                   │                   │
                ▼                   ▼                   ▼
        Product Details        Farms / Maps         Farmers
                │                   │                   │
                ▼                   ▼                   ▼
           Farm Details        Documents             Farms
                │                   │                   │
                ▼                   ▼                   ▼
              Cart             Products            Documents
                │                   │                   │
                ▼                   ▼                   ▼
            Checkout             Orders           Verification
                │                   │                   │
                ▼                   ▼                   ▼
             Payment            Earnings            Products
                │                   │                   │
                ▼                   ▼                   ▼
          Order Success          Analytics            Orders
                                                        │
                                                        ▼
                                                     Reports
```

---

# 3. Public / Customer App Flow

```text
VISITOR
  │
  ▼
HOME
  │
  ├──────────────► HOW IT WORKS
  │
  ├──────────────► LOGIN / REGISTER
  │
  └──────────────► MARKETPLACE
                         │
                         ▼
                   PRODUCT DETAIL
                         │
                         ▼
                     FARM DETAIL
                         │
                         ▼
                    ADD TO CART
                         │
                         ▼
                       CART
                         │
                         ▼
                     CHECKOUT
                         │
                         ▼
                  PAYMENT / STRIPE
                    │          │
                  SUCCESS     FAILURE
                    │          │
                    ▼          ▼
              ORDER SUCCESS   CART
                    │
                    ▼
               ORDER LIFECYCLE
```

---

# 4. Home Page `/`

## Objective

Introduce FarmTrust, explain the core trust proposition, and guide visitors toward marketplace shopping or farmer onboarding.

## Main responsibilities

- Explain FarmTrust value proposition
- Promote verified farmers and farms
- Provide marketplace entry
- Provide farmer onboarding entry
- Explain how FarmTrust works
- Provide login/register access

## Workflow

```text
HOME
 │
 ├── Hero
 │    ├── Browse Marketplace
 │    └── Become a Farmer
 │
 ├── Trust / Verification Benefits
 │
 ├── Featured Products
 │
 ├── Featured Farms / Farmers
 │
 ├── How It Works
 │
 └── Footer
```

## Primary outcomes

```text
Visitor
  ├──► Customer Shopping Journey
  ├──► Farmer Registration
  └──► Learn About FarmTrust
```

---

# 5. Marketplace `/`

## Objective

Allow customers to discover products from verified or participating farmers.

## Workflow

```text
MARKETPLACE
   │
   ├── Search
   ├── Category Filter
   ├── Farm / Farmer Filter
   └── Availability Filter
           │
           ▼
      PRODUCT GRID
           │
           ▼
     PRODUCT DETAIL
           │
           ├──► View Farm
           │
           └──► Add to Cart
```

## Mobile behavior

- Filters become a drawer/sheet.
- Product grid becomes one or two columns.
- Cards remain touch-friendly.
- No horizontal overflow.

## Desktop behavior

- Sidebar filters where appropriate.
- Multi-column product grid.
- More product metadata can be displayed inline.

---

# 6. Product Detail `/product/:id`

## Objective

Give customers enough product, farmer, farm, price, availability, and trust information to make an informed purchase.

## Workflow

```text
PRODUCT DETAIL
      │
      ├── Product Information
      ├── Price / Unit
      ├── Quantity
      ├── Availability
      ├── Harvest Information
      ├── Farmer Information
      ├── Verification Status
      └── Farm Information
              │
              ├────────► VIEW FARM
              │
              └────────► ADD TO CART
                              │
                              ▼
                             CART
```

## Key user questions

- What is the product?
- Who grew it?
- Which farm produced it?
- Is the farmer verified?
- What does it cost?
- How much is available?
- When is it harvested?
- Can it be delivered or picked up?

---

# 7. Farm Detail `/farm/:id`

## Objective

Build customer trust by showing the farm and farmer behind marketplace products.

## Workflow

```text
FARM DETAIL
    │
    ├── Farmer Profile
    ├── Verification
    ├── Farm Location
    ├── Farm Boundary
    ├── Farm Area
    ├── Crops
    └── Available Products
             │
             ▼
       PRODUCT DETAIL
             │
             ▼
          ADD TO CART
```

---

# 8. Cart `/cart`

## Objective

Allow customers to review, modify, and confirm their shopping basket before checkout.

## Workflow

```text
CART
 │
 ├── Review Products
 │
 ├── Increase / Decrease Quantity
 │
 ├── Remove Product
 │
 ├── Review Farmer Grouping
 │
 ├── Review Subtotal
 │
 └── Proceed to Checkout
             │
             ▼
          CHECKOUT
```

## Multi-farmer cart

```text
CART
 │
 ├── Farmer A
 │    ├── Product A1
 │    └── Product A2
 │
 └── Farmer B
      ├── Product B1
      └── Product B2
```

---

# 9. Checkout `/checkout`

## Objective

Collect customer fulfilment information and securely initiate payment.

## Workflow

```text
CHECKOUT
   │
   ▼
CUSTOMER INFORMATION
   │
   ├── Name
   ├── Email
   └── Phone
   │
   ▼
FULFILMENT
   │
   ├── Delivery
   │    └── Address
   │
   └── Farm Pickup
   │
   ▼
ORDER SUMMARY
   │
   ▼
CONFIRM ORDER
   │
   ▼
CREATE ORDER
   │
   ▼
CREATE PAYMENT SESSION
   │
   ▼
PAYMENT
```

## Payment result

```text
PAYMENT
  │
  ├── SUCCESS ──► ORDER SUCCESS
  │
  └── FAILURE ──► RETURN / RETRY CHECKOUT
```

---

# 10. Order Success `/order-success`

## Objective

Confirm that the customer journey has completed successfully and provide useful order information.

## Workflow

```text
PAYMENT SUCCESS
      │
      ▼
ORDER SUCCESS
      │
      ├── Order Number
      ├── Payment Status
      ├── Farmer
      ├── Products
      ├── Amount
      └── Fulfilment Method
              │
              ├──► Continue Shopping
              └──► View Order / Status
```

---

# 11. How It Works `/how-it-works`

## Objective

Explain the FarmTrust trust and verification model in simple steps.

## Workflow

```text
FARMER REGISTRATION
        │
        ▼
FARM INFORMATION
        │
        ▼
FARM BOUNDARY MAPPING
        │
        ▼
DOCUMENT SUBMISSION
        │
        ▼
VERIFICATION CHECKS
        │
        ▼
HUMAN / ADMIN REVIEW
        │
    ┌───┴────┐
    ▼        ▼
APPROVED   FLAGGED
    │        │
    ▼        ▼
VERIFIED   FIX ISSUES
FARMER        │
    │         └──► RECHECK
    ▼
PRODUCT LISTING
    │
    ▼
CUSTOMER PURCHASE
```

> Satellite imagery should be described as supporting evidence, not as legal proof of ownership.

---

# 12. Login `/login`

## Objective

Provide secure authentication for customers, farmers, and authorized administrators.

## Workflow

```text
LOGIN
 │
 ├── Email + Password
 ├── Social / Google Login where enabled
 └── Forgot Password
          │
          ▼
      AUTHENTICATION
          │
      ┌───┼─────────┐
      ▼   ▼         ▼
 Customer Farmer   Admin
      │     │        │
      ▼     ▼        ▼
 Marketplace Farmer  Admin
             Portal  Portal
```

---

# 13. Register `/register`

## Objective

Create a FarmTrust account and route the user into the appropriate onboarding experience.

## Workflow

```text
REGISTER
   │
   ▼
PERSONAL INFORMATION
   │
   ▼
CONTACT INFORMATION
   │
   ▼
ACCOUNT CREDENTIALS
   │
   ▼
CREATE ACCOUNT
   │
   ├──► CUSTOMER
   │
   └──► FARMER
            │
            ▼
      FARMER ONBOARDING
```

---

# 14. Forgot Password `/forgot-password`

## Objective

Allow users to securely request a password reset.

## Workflow

```text
FORGOT PASSWORD
      │
      ▼
ENTER EMAIL
      │
      ▼
RESET REQUEST
      │
      ▼
RESET LINK
      │
      ▼
NEW PASSWORD
      │
      ▼
LOGIN
```

---

# 15. Farmer Portal Master Flow

```text
                    FARMER PORTAL
                          │
                          ▼
                    DASHBOARD
                          │
       ┌──────────┬───────┼────────┬──────────┐
       ▼          ▼       ▼        ▼          ▼
 Verification   Farms  Documents Products    Orders
       │          │       │        │           │
       │          ▼       │        ▼           ▼
       │       Farm Map   │     Publish     Fulfil
       │          │       │     Products     Orders
       │          │       │
       ▼          ▼       ▼
 Verification   Farm    Documents
 Progress       Details  Review
       │
       └──────────────────────────────┐
                                      ▼
                                  Earnings
                                      │
                                      ▼
                                  Analytics
```

---

# 16. Farmer Dashboard `/farmer`

## Objective

Provide a single operational command center for the farmer.

## Workflow

```text
FARMER DASHBOARD
 │
 ├── Verification Status
 ├── Farm Status
 ├── Product Summary
 ├── Order Summary
 ├── Earnings Summary
 ├── Analytics Summary
 └── Quick Actions
       │
       ├── Add Farm
       ├── Upload Document
       ├── Add Product
       └── View Orders
```

## Core farmer business loop

```text
ADD FARM
   ↓
VERIFY FARMER / FARM
   ↓
ADD PRODUCTS
   ↓
PUBLISH PRODUCTS
   ↓
RECEIVE ORDER
   ↓
ACCEPT ORDER
   ↓
PREPARE
   ↓
DISPATCH
   ↓
DELIVER
   ↓
COMPLETE
   ↓
EARNINGS
   ↓
ANALYTICS
```

---

# 17. Farmer Verification `/farmer/verification`

## Objective

Guide farmers through every step required to achieve verification.

## Workflow

```text
VERIFICATION CENTER
       │
       ▼
IDENTITY CHECK
       │
       ▼
FARM INFORMATION
       │
       ▼
FARM BOUNDARY
       │
       ▼
DOCUMENTS
       │
       ▼
AUTOMATED CHECKS
       │
 ┌─────┼─────────┬────────┐
 ▼     ▼         ▼        ▼
PASS  FLAG      FAIL    PENDING
 │     │          │
 │     └────┬─────┘
 │          ▼
 │      FIX ISSUES
 │          │
 │          ▼
 │       RECHECK
 │
 └──────────┬────────────┐
            ▼
       FINAL REVIEW
            │
       ┌────┴─────┐
       ▼          ▼
   VERIFIED     FLAGGED
```

---

# 18. Farmer Farms `/farmer/farms`

## Objective

Allow farmers to view, create, edit, and manage their farms.

## Workflow

```text
MY FARMS
   │
   ├── Farm A
   │    ├── View
   │    └── Edit
   │
   ├── Farm B
   │    ├── View
   │    └── Edit
   │
   └── ADD FARM
          │
          ▼
      FARM EDITOR
```

---

# 19. Farm Editor `/farmer/farms/new`

## Objective

Create or update farm information and define the farm boundary.

## Workflow

```text
FARM EDITOR
   │
   ▼
BASIC FARM INFORMATION
   │
   ▼
LOCATION
   │
   ▼
MAP / GPS
   │
   ▼
DRAW BOUNDARY
   │
   ▼
CALCULATE AREA
   │
   ▼
ADD CROPS
   │
   ▼
SAVE FARM
   │
   ▼
CONTINUE VERIFICATION
```

---

# 20. Farmer Documents `/farmer/documents`

## Objective

Provide a document vault for verification-related uploads and status tracking.

## Workflow

```text
DOCUMENT VAULT
   │
   ├── Required
   ├── Uploaded
   ├── Pending Review
   ├── Approved
   └── Rejected
          │
          ▼
      DOCUMENT DETAIL
          │
          ├── Status
          ├── Review Notes
          └── Required Action
```

---

# 21. Farmer Products `/farmer/products`

## Objective

Allow farmers to create, publish, update, and archive marketplace products.

## Workflow

```text
PRODUCT MANAGER
    │
    ▼
CREATE PRODUCT
    │
    ▼
SELECT FARM
    │
    ▼
PRODUCT INFORMATION
    │
    ├── Name
    ├── Category
    ├── Price
    ├── Unit
    ├── Quantity
    ├── Harvest Date
    └── Fulfilment
    │
    ▼
SAVE DRAFT
    │
    ▼
PUBLISH
    │
    ▼
MARKETPLACE
    │
    ├── Update Stock
    ├── Mark Sold Out
    └── Archive
```

---

# 22. Farmer Orders `/farmer/orders`

## Objective

Allow farmers to monitor and fulfil customer orders.

## Order lifecycle

```text
PLACED
  │
  ▼
ACCEPTED
  │
  ▼
PREPARING
  │
  ▼
DISPATCHED
  │
  ▼
DELIVERED
  │
  ▼
COMPLETED
```

## Exception paths

```text
ORDER
 │
 ├── Payment Failed
 │
 └── Cancelled
```

---

# 23. Farmer Earnings `/farmer/earnings`

## Objective

Show farmer sales, earnings, pending settlements, and customer/order metrics.

## Workflow

```text
COMPLETED / PAID ORDERS
          │
          ▼
     EARNINGS ENGINE
          │
     ┌────┼──────────┐
     ▼    ▼          ▼
 Revenue Orders    Customers
     │
     ▼
Earnings Dashboard
     │
     ├── Today's Sales
     ├── Total Earnings
     ├── Pending Settlement
     ├── Quantity Sold
     └── Order Count
```

---

# 24. Farmer Analytics `/farmer/analytics`

## Objective

Help farmers understand business performance.

## Workflow

```text
SALES DATA
   │
   ├── Revenue
   ├── Orders
   ├── Products
   ├── Customers
   └── Quantity
          │
          ▼
      ANALYTICS
          │
          ├── Revenue Trend
          ├── Order Trend
          ├── Best Products
          └── Sales Performance
```

---

# 25. Admin Portal Master Flow

```text
                         ADMIN
                           │
                           ▼
                       DASHBOARD
                           │
       ┌───────────┬───────┼──────────┬──────────┐
       ▼           ▼       ▼          ▼          ▼
    FARMERS       FARMS  DOCUMENTS VERIFICATION PRODUCTS
       │           │       │          │          │
       └───────────┴───────┴──────────┴──────────┘
                           │
                           ▼
                         ORDERS
                           │
                           ▼
                        REPORTS
```

---

# 26. Admin Dashboard `/admin`

## Objective

Provide platform-wide operational visibility.

## Workflow

```text
ADMIN DASHBOARD
   │
   ├── Farmers
   ├── Farms
   ├── Pending Verification
   ├── Products
   ├── Orders
   ├── Revenue
   └── Alerts
        │
        ▼
   ADMIN ACTIONS
```

---

# 27. Admin Farmers `/admin/farmers`

## Objective

Manage farmer accounts and their verification state.

## Workflow

```text
FARMERS
   │
   ▼
SEARCH / FILTER
   │
   ▼
FARMER PROFILE
   │
   ├── Contact
   ├── Location
   ├── Farms
   ├── Verification
   └── Products
          │
          ▼
   VERIFY / REVOKE / REVIEW
```

---

# 28. Admin Farms `/admin/farms`

## Objective

Review farm records, boundaries, locations, areas, and verification state.

## Workflow

```text
FARMS
  │
  ▼
SEARCH / FILTER
  │
  ▼
FARM DETAIL
  │
  ├── Farmer
  ├── Location
  ├── Boundary
  ├── Area
  └── Verification
          │
          ▼
      ADMIN REVIEW
```

---

# 29. Admin Documents `/admin/documents`

## Objective

Review and manage documents submitted by farmers.

## Workflow

```text
DOCUMENT QUEUE
      │
      ▼
FILTER
      │
      ├── Pending
      ├── Approved
      ├── Rejected
      └── Needs Review
      │
      ▼
OPEN DOCUMENT
      │
      ▼
REVIEW
      │
   ┌──┴───────┐
   ▼          ▼
APPROVE     REJECT
              │
              ▼
        REVIEW REASON
```

---

# 30. Admin Verification `/admin/verification`

## Objective

Operate the full FarmTrust verification pipeline.

## Workflow

```text
VERIFICATION QUEUE
       │
       ▼
SELECT FARMER / FARM
       │
       ▼
REVIEW CHECKS
       │
       ├── Identity
       ├── Farm
       ├── Documents
       ├── Satellite Evidence
       ├── Area Match
       └── Duplicate Check
       │
       ▼
FINAL REVIEW
       │
   ┌───┴─────┐
   ▼         ▼
APPROVE     FLAG
              │
              ▼
          FARMER FIX
              │
              └──────► RECHECK
```

---

# 31. Admin Products `/admin/products`

## Objective

Moderate marketplace products and protect marketplace quality.

## Workflow

```text
PRODUCTS
   │
   ▼
SEARCH / FILTER
   │
   ▼
PRODUCT DETAIL
   │
   ├── Farmer
   ├── Farm
   ├── Price
   ├── Stock
   └── Status
          │
          ▼
      ADMIN ACTION
          │
     ┌────┴────┐
     ▼         ▼
  APPROVE    ARCHIVE
```

---

# 32. Admin Orders `/admin/orders`

## Objective

Provide platform-wide order visibility and operational monitoring.

## Workflow

```text
ALL ORDERS
    │
    ▼
SEARCH / FILTER
    │
    ▼
ORDER DETAIL
    │
    ├── Customer
    ├── Farmer
    ├── Products
    ├── Amount
    ├── Payment
    └── Delivery Status
            │
            ▼
       MONITOR ORDER
```

---

# 33. Admin Reports `/admin/reports`

## Objective

Provide platform-level business and operational insights.

## Workflow

```text
PLATFORM DATA
     │
     ├── Users
     ├── Farmers
     ├── Farms
     ├── Products
     ├── Orders
     └── Revenue
          │
          ▼
       REPORTS
          │
          ├── Platform Overview
          ├── Order Metrics
          ├── Revenue
          ├── Monthly Revenue
          └── Growth / Trends
```

---

# 34. Complete Farmer Business Loop

```text
FARMER REGISTRATION
       │
       ▼
FARMER ONBOARDING
       │
       ▼
ADD FARM
       │
       ▼
DRAW FARM BOUNDARY
       │
       ▼
UPLOAD DOCUMENTS
       │
       ▼
VERIFICATION
       │
   ┌───┴─────┐
   ▼         ▼
APPROVED   FLAGGED
   │         │
   ▼         ▼
VERIFIED   FIX ISSUES
FARMER        │
   │          └────► RECHECK
   ▼
ADD PRODUCTS
   │
   ▼
PUBLISH PRODUCTS
   │
   ▼
CUSTOMER DISCOVERY
   │
   ▼
CUSTOMER ORDER
   │
   ▼
PAYMENT
   │
   ▼
FARMER ACCEPTS
   │
   ▼
PREPARES
   │
   ▼
DISPATCHES
   │
   ▼
DELIVERS
   │
   ▼
COMPLETES
   │
   ▼
EARNINGS
   │
   ▼
ANALYTICS
```

---

# 35. Complete Customer Business Loop

```text
VISITOR
   │
   ▼
HOME
   │
   ▼
MARKETPLACE
   │
   ▼
PRODUCT DETAIL
   │
   ├────► FARM DETAIL
   │
   ▼
ADD TO CART
   │
   ▼
CART
   │
   ▼
CHECKOUT
   │
   ▼
ORDER CREATED
   │
   ▼
PAYMENT
   │
 ┌─┴─────────┐
 ▼           ▼
PAID       FAILED
 │           │
 ▼           ▼
ORDER       RETRY
SUCCESS
 │
 ▼
FARMER FULFILMENT
 │
 ▼
DELIVERY / PICKUP
 │
 ▼
ORDER COMPLETE
 │
 ▼
REVIEW / FEEDBACK
```

---

# 36. Complete Admin Control Loop

```text
ADMIN
 │
 ▼
DASHBOARD
 │
 ├──► FARMERS
 │       │
 │       └──► VERIFICATION
 │
 ├──► FARMS
 │       │
 │       └──► BOUNDARY REVIEW
 │
 ├──► DOCUMENTS
 │       │
 │       └──► DOCUMENT REVIEW
 │
 ├──► VERIFICATION
 │       │
 │       └──► APPROVE / FLAG
 │
 ├──► PRODUCTS
 │       │
 │       └──► MODERATION
 │
 ├──► ORDERS
 │       │
 │       └──► MONITORING
 │
 └──► REPORTS
         │
         ▼
   PLATFORM INSIGHTS
```

---

# 37. Responsive Application Architecture

```text
                 FARMTRUST APP
                       │
            ┌──────────┴──────────┐
            │                     │
         MOBILE                DESKTOP
            │                     │
            └──────────┬──────────┘
                       │
                SAME COMPONENTS
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     CUSTOMER        FARMER         ADMIN
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                SAME BUSINESS LOGIC
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
            AUTH    DATABASE   PAYMENTS
```

## Responsive rules

### Mobile

- No horizontal page overflow.
- Sidebars become drawers.
- Multi-column grids collapse.
- Tables become cards or controlled horizontal containers.
- Forms become single-column.
- Maps resize to viewport width.
- Charts become responsive.
- Buttons have comfortable touch targets.
- Dialogs fit within the viewport.

### Laptop/Desktop

- Persistent sidebar where appropriate.
- Multi-column dashboards.
- Wider data tables.
- Larger map/chart areas.
- More information displayed simultaneously.
- Content uses sensible maximum widths.

---

# 38. Global Navigation Model

```text
PUBLIC
 ├── Home
 ├── Marketplace
 ├── How It Works
 ├── Login
 └── Register

CUSTOMER
 ├── Marketplace
 ├── Product Detail
 ├── Farm Detail
 ├── Cart
 ├── Checkout
 └── Order Success

FARMER
 ├── Dashboard
 ├── Verification
 ├── Farms
 ├── Documents
 ├── Products
 ├── Orders
 ├── Earnings
 └── Analytics

ADMIN
 ├── Dashboard
 ├── Farmers
 ├── Farms
 ├── Documents
 ├── Verification
 ├── Products
 ├── Orders
 └── Reports
```

---

# 39. Global UX Rule

Every page should follow this structure:

```text
PAGE
 │
 ├── Clear Page Objective
 │
 ├── Primary Information
 │
 ├── Primary Action
 │
 ├── Secondary Actions
 │
 ├── Loading State
 │
 ├── Empty State
 │
 ├── Error State
 │
 └── Success / Confirmation State
```

The application should always make the next recommended action obvious.

---

# 40. Final Product Principle

FarmTrust should feel like one connected ecosystem:

```text
                    TRUST
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       FARMER        FARM       PRODUCT
          │           │           │
          └───────────┼───────────┘
                      ▼
                  CUSTOMER
                      │
                      ▼
                    ORDER
                      │
                      ▼
                   PAYMENT
                      │
                      ▼
                 FULFILMENT
                      │
                      ▼
                   EARNINGS
                      │
                      ▼
                 PLATFORM DATA
                      │
                      ▼
                    ADMIN
                      │
                      └──────► TRUST
```

The key design goal is to keep the entire experience **simple for customers, operationally useful for farmers, controllable for admins, and consistently responsive across mobile and laptop/desktop screens**.

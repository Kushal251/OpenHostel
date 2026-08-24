# OpenHostel MVP v1 Specification

## Overview

This document defines the complete scope of **OpenHostel MVP v1**.

The objective is to build a working hostel and mess management system that can be deployed in a college hostel. Any feature not listed in this document is considered **out of scope** for MVP.

---

# MVP Goal

Digitize the complete workflow from student registration to daily mess attendance.

**Core workflow**

1. Student registers
2. Caretaker approves student
3. Student receives temporary password
4. Student logs in
5. Student applies for mess
6. Vendor verifies payment
7. Mess becomes active
8. Student scans QR for meals
9. Leave automatically pauses mess

---

# User Roles

| Role               | Included in MVP |
| ------------------ | --------------- |
| Student            | Yes             |
| Caretaker          | Yes             |
| Vendor (Mess Head) | Yes             |
| Mess Staff         | Yes             |
| Gatekeeper         | Yes             |
| Admin              | Basic           |

---

# Module 1 — Authentication

## Student Registration

A student provides:

* Full Name
* Email
* Phone Number
* Hostel
* Room Number
* Role (Student)

**Status Flow**

Pending → Approved

After registration the student cannot log in until approved by the caretaker.

---

## Temporary Password

Caretaker generates or assigns a temporary password.

Student uses:

* Email
* Temporary Password

After first login, the student may create a new password.

---

## Password Recovery

Password recovery is performed using verified email.

Flow:

Forgot Password → Email Verification → New Password

---

# Module 2 — Hostel Information

Every student can browse all hostels.

Each hostel displays:

* Hostel Name
* Capacity
* Available Seats
* Warden
* Caretaker
* Mess Information
* Mess Timings
* Contact Information

Students have **read-only access** to other hostels.

Operational actions remain restricted to their assigned hostel.

---

# Module 3 — Student Dashboard

The student dashboard includes:

## Profile

* Name
* Room Number
* Hostel
* Email
* Phone

## Hostel

* Warden
* Caretaker
* Hostel Details

## Mess

* Current Menu
* Available Plans
* Subscription Status
* Expiry Date

## QR

* Personal Mess QR
* Active / Inactive Status

---

# Module 4 — Mess Subscription

Students can choose a subscription plan.

Example plans:

| Plan     | Duration |
| -------- | -------- |
| Trial    | 10 Days  |
| Standard | 15 Days  |
| Monthly  | 30 Days  |

---

## Application Flow

Apply Plan

↓

Pending Payment

↓

Upload Screenshot

↓

Vendor Verification

↓

Mess Active

---

# Module 5 — Vendor Dashboard

Vendor can manage only their own mess.

## Features

### Menu Management

* Upload menu image
* Create weekly menu
* Edit breakfast
* Edit lunch
* Edit dinner
* Edit tea

### Pricing

Vendor defines:

* 10 Day Price
* 15 Day Price
* 30 Day Price

### Student Management

Vendor can:

* View applicants
* Approve payments
* Activate subscription
* View active students
* View expired subscriptions

---

# Module 6 — QR Attendance

Every active student receives one digital QR.

## Attendance Rules

A meal is recorded only if:

* Subscription is active
* Student belongs to the mess
* QR is valid
* Meal timing is valid
* Student has not already taken that meal

Meals include:

* Breakfast
* Lunch
* Dinner
* Tea

Attendance stores:

* Student
* Meal Type
* Date
* Time
* Vendor

---

# Module 7 — Leave / Pause

Students request leave through the hostel authority.

Approved leave automatically pauses mess access.

## State Diagram

Active

↓

Leave Approved

↓

Paused

↓

Return

↓

Active

The subscription duration is adjusted according to the approved leave policy.

---

# Module 8 — Gatekeeper

Gatekeeper can:

* View leave requests
* Approve leave
* Reject leave
* View student hostel details

Gatekeeper cannot edit mess pricing or hostel administration.

---

# Module 9 — Analytics

Vendor dashboard displays:

## Daily Report

* Breakfast Count
* Lunch Count
* Dinner Count
* Tea Count

## Subscription Report

* Active Students
* Pending Payments
* Expiring Soon
* Total Subscriptions

These analytics are operational, not financial.

---

# Database Entities

MVP requires the following primary entities:

* User
* Hostel
* Room
* Student
* Caretaker
* Vendor
* Mess
* Menu
* Subscription
* Payment
* Attendance
* Leave
* QR Token

Additional entities should not be introduced unless required.

---

# Success Criteria

MVP is considered complete when all of the following work end-to-end:

* Student registration
* Caretaker approval
* Temporary password login
* Password reset
* Hostel information page
* Mess menu
* Mess plan selection
* Payment verification
* Vendor activation
* QR attendance
* Leave pause system
* Daily attendance reports

---

# Out of Scope

The following features are intentionally excluded from MVP v1:

* AI chatbot
* Face recognition
* Biometric attendance
* Mobile application
* Online payment gateway
* Complaint system
* Laundry management
* Visitor management
* Inventory tracking
* Expense management
* Food prediction AI
* Push notifications

These features belong to future versions of OpenHostel.

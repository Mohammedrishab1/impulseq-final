# 🏥 Hospital Token Management System – Task List

## 🎯 Objective

Implement a **priority-based dynamic queue system** and **move token control to admin dashboard** without breaking existing functionality.

---

## 🧠 Queue System (Core Logic)

### ✅ Tasks

* [ ] Create/verify `patients_queue` table in database

* [ ] Add fields:

  * [ ] `id` (uuid)
  * [ ] `name`
  * [ ] `priority` (emergency / senior / normal)
  * [ ] `status` (waiting / in-progress / completed)
  * [ ] `created_at` (timestamp)

* [ ] Remove dependency on fixed token numbers

* [ ] Implement dynamic token calculation (based on queue position)

---

## 🔄 Patient Registration Flow

* [ ] On receptionist registration:

  * [ ] Insert patient into DB with `status = waiting`
  * [ ] Fetch all active patients (waiting + in-progress)
  * [ ] Sort by:

    * [ ] Priority (emergency > senior > normal)
    * [ ] Created time (ascending)
  * [ ] Recalculate queue positions dynamically

---

## ⚙️ Backend Functions

* [ ] Create `getQueueWithTokens()`

  * [ ] Fetch all active patients
  * [ ] Apply sorting logic
  * [ ] Assign token dynamically (index + 1)

* [ ] Create `addPatientToQueue(patient)`

  * [ ] Insert new patient
  * [ ] Trigger queue recalculation

* [ ] Create `completeCurrentPatient()`

  * [ ] Mark first patient as `completed`
  * [ ] Update queue automatically

---

## 🖥 Admin Dashboard

* [ ] Add **"Call Next Patient"** button
* [ ] On click:

  * [ ] Fetch current queue
  * [ ] Move first patient → `in-progress`
  * [ ] Trigger update to frontend + ESP32

---

## 👨‍⚕️ Doctor Dashboard

* [ ] REMOVE "Call Next Patient" button
* [ ] Ensure doctor can:

  * [ ] View current patient
  * [ ] Mark consultation as completed (optional)
* [ ] Verify no UI or logic breaks

---

## 🔌 ESP32 Integration

* [ ] Create API endpoint:

  * [ ] Return current token
  * [ ] Return next token

* [ ] Update ESP32 logic:

  * [ ] Fetch data from API
  * [ ] Display on OLED:

    * Current token
    * Next token

---

## 🔄 Backward Compatibility

* [ ] Ensure existing APIs still work
* [ ] Avoid breaking schema (only extend if needed)
* [ ] Test old flows (doctor + receptionist)
* [ ] Maintain Supabase real-time subscriptions

---

## 🧪 Testing

* [ ] Test empty queue scenario
* [ ] Test multiple patients with different priorities
* [ ] Test real-time updates
* [ ] Test ESP32 display sync
* [ ] Test admin calling next patient
* [ ] Test doctor dashboard stability

---

## 🚀 Optional Enhancements

* [ ] Add estimated wait time
* [ ] Add queue preview for receptionist
* [ ] Add buzzer/sound alert on token call
* [ ] Add patient SMS/notification system

---

## ✅ Final Checklist

* [ ] Dynamic queue working
* [ ] Priority sorting correct
* [ ] Admin controls working
* [ ] Doctor dashboard stable
* [ ] ESP32 synced
* [ ] No breaking changes

---

**Status:** ⏳ In Progress
**Priority:** 🔥 High

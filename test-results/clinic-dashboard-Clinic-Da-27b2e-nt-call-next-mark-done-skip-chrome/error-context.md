# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clinic-dashboard.spec.js >> Clinic Dashboard � mobile (390px) >> [mobile (390px)] Queue operations: add patient, call next, mark done, skip
- Location: tests\e2e\clinic-dashboard.spec.js:159:9

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - main [ref=f1e3]:
      - generic [ref=f1e4]:
        - generic [ref=f1e5]:
          - generic "Click to change logo" [ref=f1e6] [cursor=pointer]: Q
          - generic [ref=f1e12]:
            - generic [ref=f1e13]: QUEUE DASHBOARD · MUMBAI
            - generic [ref=f1e14]:
              - heading "QA Clinic 6725077981" [level=1] [ref=f1e15]
              - button "Edit" [ref=f1e16] [cursor=pointer]
        - generic [ref=f1e20]:
          - generic [ref=f1e21]: Mon, Aug 10, 2026
          - generic [ref=f1e25]: LIVE QUEUE
          - generic [ref=f1e28]:
            - generic [ref=f1e29]: "06"
            - generic [ref=f1e31]: ":"
            - generic [ref=f1e32]: "38"
            - generic [ref=f1e34]: ":"
            - generic [ref=f1e35]:
              - generic [ref=f1e36]: "29"
              - generic [ref=f1e37]: "30"
            - generic [ref=f1e38]: PM
          - button "Open Navigation Menu" [active] [ref=f1e39] [cursor=pointer]
      - generic [ref=f1e41]:
        - generic [ref=f1e42]:
          - generic [ref=f1e43]: Total Today
          - generic [ref=f1e49]: "01"
        - generic [ref=f1e52]:
          - generic [ref=f1e53]: Waiting
          - generic [ref=f1e61]: "00"
        - generic [ref=f1e64]:
          - generic [ref=f1e65]: Done
          - generic [ref=f1e71]: "01"
        - generic [ref=f1e74]:
          - generic [ref=f1e75]: Avg Waiting Time
          - generic [ref=f1e81]:
            - generic [ref=f1e82]: "00"
            - text: m
      - generic [ref=f1e84]:
        - generic [ref=f1e85]: LIVE QUEUE CONTROL & BROADCAST CONSOLE
        - paragraph [ref=f1e89]: Scan the clinic QR code to instantly join the live queue. Broadcast live public notices to all queued patients or manually manage check-in records.
        - generic [ref=f1e90]:
          - button "DISPLAY CLINIC QR CODE" [ref=f1e91] [cursor=pointer]
          - button "MANUAL CHECK-IN" [ref=f1e98] [cursor=pointer]
          - button "NOTICE TO QUEUE" [ref=f1e102] [cursor=pointer]
          - button "PAUSE QUEUE" [ref=f1e106] [cursor=pointer]
      - generic [ref=f1e110]:
        - generic [ref=f1e111]:
          - generic [ref=f1e112]:
            - generic [ref=f1e113]: WITH DOCTOR
            - generic [ref=f1e116]: 0 IN CONSULTATION
          - generic [ref=f1e117]: No patient inside consultation room
        - generic [ref=f1e119]:
          - generic [ref=f1e120]:
            - generic [ref=f1e121]: NEXT IN QUEUE
            - generic [ref=f1e127]: READY FOR ADMIT
          - generic [ref=f1e128]: Queue is currently clear
      - generic [ref=f1e131]:
        - button "Active Queue 0" [ref=f1e132] [cursor=pointer]:
          - text: Active Queue
          - generic [ref=f1e133]: "0"
        - button "Completed 1" [ref=f1e134] [cursor=pointer]:
          - text: Completed
          - generic [ref=f1e135]: "1"
        - button "Payments" [ref=f1e136] [cursor=pointer]
      - generic [ref=f1e137]:
        - textbox "Search patient name, token or phone number..." [ref=f1e143]
        - generic [ref=f1e144]:
          - generic [ref=f1e150]: No patients currently waiting in queue
          - generic [ref=f1e151]: Patients scanning the OPD QR code or added via Manual Check-in will appear here in real time.
    - generic [ref=f1e154]:
      - generic [ref=f1e155]:
        - generic [ref=f1e156]:
          - generic [ref=f1e163]:
            - generic [ref=f1e164]: TokenPE
            - generic [ref=f1e165]: QA Clinic 6725077981
          - button [ref=f1e166] [cursor=pointer]
        - generic [ref=f1e170]:
          - generic [ref=f1e171]: NAVIGATION
          - button "Live Queue" [ref=f1e172] [cursor=pointer]
          - button "Manual Check-in" [ref=f1e178] [cursor=pointer]
          - button "Notice to Queue" [ref=f1e182] [cursor=pointer]
          - button "OPD QR Poster" [ref=f1e186] [cursor=pointer]
          - button "Payments Ledger" [ref=f1e193] [cursor=pointer]
          - button "Completed Consultations" [ref=f1e196] [cursor=pointer]
          - generic [ref=f1e201]: MANAGEMENT
          - button "Appointments & Analytics" [ref=f1e202] [cursor=pointer]
          - button "Doctors & Patients" [ref=f1e205] [cursor=pointer]
          - button "Settings & Billing" [ref=f1e210] [cursor=pointer]
      - button "Logout" [ref=f1e215] [cursor=pointer]
  - alert [ref=f1e219]
  - generic [ref=f1e220]:
    - generic [ref=f1e221]:
      - generic [ref=f1e222]: 🍪
      - paragraph [ref=f1e223]:
        - text: We use essential cookies for secure login & preferences. No ads or tracking.
        - link "Privacy Policy" [ref=f1e224] [cursor=pointer]:
          - /url: /privacy
    - button "Got it" [ref=f1e225] [cursor=pointer]
```
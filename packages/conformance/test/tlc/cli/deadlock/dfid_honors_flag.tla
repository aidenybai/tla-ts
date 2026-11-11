(*---
description: Depth-first checking takes the same deadlock setting.
ref: tlc2/tool/DFIDModelChecker.java
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -deadlock
  - -dfid
  - "3"
---*)
---- MODULE dfid_honors_flag ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2206:0 Progress(-1) at <date>: 3 states generated, 2 distinct states found, -1 states left on queue.
    2204:0 3 states generated, 2 distinct states found.
---*)

(*---
description: A false implied action under -dfid names the split conjunct by its location, prints a trace without action names, and exits with the action-property status.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: liveness-violation
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
args:
  - -dfid
  - "10"
---*)
---- MODULE implied_action_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
Prop == [][x' = x + 1]_x /\ [][x' < 2]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2112:1 Action property line 18, col 29 to line 18, col 40 of module implied_action_false is violated.
    2121:1 The behavior up to this point is:
    2216:4 1:
    x = 0
    2216:4 2:
    x = 1
    2216:4 3:
    x = 2
    2206:0 Progress(-1) at <date>: 4 states generated, 3 distinct states found, -1 states left on queue.
    2204:0 4 states generated, 3 distinct states found.
---*)

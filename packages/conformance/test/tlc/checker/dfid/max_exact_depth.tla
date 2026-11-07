(*---
description: A -dfid limit equal to the needed depth finishes the search only if the next level is reached.
ref: tlc2/tool/DFIDModelChecker.java#modelCheck
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "3"
---*)
---- MODULE max_exact_depth ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2206:0 Progress(-1) at <date>: 4 states generated, 3 distinct states found, -1 states left on queue.
    2204:0 4 states generated, 3 distinct states found.
---*)

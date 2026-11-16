(*---
description: -dfid 1 starts at level 2, above the maximum, so it enters no iteration.
ref: tlc2/tool/DFIDModelChecker.java#modelCheck
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "1"
---*)
---- MODULE max_one ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2206:0 Progress(-1) at <date>: 1 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 1 distinct states found.
---*)

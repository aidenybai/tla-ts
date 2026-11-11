(*---
description: -dfid 0 enters no iteration, so the run ends with the general error code and no success message.
ref: tlc2/tool/DFIDModelChecker.java#modelCheck
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "0"
---*)
---- MODULE max_zero ----
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

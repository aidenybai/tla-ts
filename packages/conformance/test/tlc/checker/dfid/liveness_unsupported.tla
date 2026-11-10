(*---
description: -dfid refuses a liveness property with its unsupported-liveness message.
ref: tlc2/tool/DFIDModelChecker.java#modelCheck
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -dfid
  - "10"
---*)
---- MODULE liveness_unsupported ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
Spec == Init /\ [][Next]_x
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    1000:1 Depth-First Iterative Deepening mode does not support checking liveness properties (https://github.com/tlaplus/tlaplus/issues/548).  Please check liveness properties in Breadth-First-Search mode.
---*)

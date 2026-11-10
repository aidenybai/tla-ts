(*---
description: 'SANY rejects an action conjunct beside a box: land has both temporal formula and action as arguments. TLC never gets to its own conjunct check.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [][Next]_x /\ Next
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 9 to line 15, col 34 of module action_conjunct
    | \land has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)

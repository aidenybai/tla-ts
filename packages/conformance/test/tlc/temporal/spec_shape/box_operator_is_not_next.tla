(*---
description: 'SANY rejects []Box when Box is a definition equal to [Next]_x: the box must be followed syntactically by [A]_v.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_operator_is_not_next ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Box == [Next]_x
Spec == Init /\ []Box
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 17, col 17 to line 17, col 21 of module box_operator_is_not_next
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)

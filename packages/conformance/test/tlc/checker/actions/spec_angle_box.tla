(*---
description: "[](x' = x + 1) isn't of the form [A]_v, so the semantic pass rejects it before TLC starts."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: parse-error
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE spec_angle_box ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Spec == Init /\ [](x' = x + 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 17 to line 14, col 30 of module spec_angle_box
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)

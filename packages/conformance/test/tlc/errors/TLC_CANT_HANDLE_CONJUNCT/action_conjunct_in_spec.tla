(*---
description: An action conjunct in a SPECIFICATION isn't a form TLC can split.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: config-error
config: |
  SPECIFICATION Spec
---*)
---- MODULE action_conjunct_in_spec ----
VARIABLE x
Init == x = 0
Spec == Init /\ (x' = 1)
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2239:1 TLC cannot handle this conjunct of the spec:
    line 11, col 18 to line 11, col 23 of module action_conjunct_in_spec
---*)

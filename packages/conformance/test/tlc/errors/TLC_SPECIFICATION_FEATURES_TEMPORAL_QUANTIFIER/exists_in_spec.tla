(*---
description: A temporal existential in a SPECIFICATION is refused.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: tlc-error
config: |
  SPECIFICATION Spec
---*)
---- MODULE exists_in_spec ----
VARIABLE x
Init == x = 0
Spec == \EE y : Init /\ [][x' = x]_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2301:1 TLC does not support temporal existential, nor universal, quantification over state variables.
---*)

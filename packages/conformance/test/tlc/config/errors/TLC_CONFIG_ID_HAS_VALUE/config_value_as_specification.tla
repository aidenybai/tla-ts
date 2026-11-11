(*---
description: A definition given a value in the file fails as SPECIFICATION with this error.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Spec
  CONSTANT Spec = TRUE
---*)
---- MODULE config_value_as_specification ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The value of Spec is equal to TRUE
---*)

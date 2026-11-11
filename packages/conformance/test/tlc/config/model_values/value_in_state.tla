(*---
description: A model value held by a variable prints by name in the error trace.
ref: tlc2/value/impl/ModelValue.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  CONSTANT A = my_value
  INVARIANT Inv
---*)
---- MODULE value_in_state ----
CONSTANT A
VARIABLE x
Init == x = A
Next == x' = x
Inv == x # A
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = my_value
---*)

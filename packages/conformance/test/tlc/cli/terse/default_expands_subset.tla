(*---
description: By default, a SUBSET value in a state is expanded when printed.
ref: tlc2/value/impl/SubsetValue.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE default_expands_subset ----
EXTENDS Naturals
VARIABLE x
Init == x = SUBSET {1, 2}
Next == x' = x
Inv == x = {}
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = {{}, {1}, {2}, {1, 2}}
---*)

(*---
description: "A function on an enumerated 1..n prints as a tuple in the error trace, whatever its representation."
ref: "tlc2/value/impl/FcnRcdValue.java#toString"
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE trace_prints_function_as_tuple ----
EXTENDS Integers
VARIABLE x
Init == x = [i \in {1, 2} |-> i]
Next == UNCHANGED x
Inv == x # <<1, 2>>
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = <<1, 2>>
---*)

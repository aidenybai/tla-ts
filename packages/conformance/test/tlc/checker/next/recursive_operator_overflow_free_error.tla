(*---
description: A recursive function with no base case for the argument reaches a domain error during generation.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
flags: [exit-only]
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE recursive_operator_overflow_free_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
F[i \in 0..2] == IF i = 0 THEN 0 ELSE F[i - 2]
Next == x' = F[1]
====

(*--- recorded
all:
  exit: 75
---*)

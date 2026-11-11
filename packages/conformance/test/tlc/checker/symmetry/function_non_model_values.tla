(*---
description: A symmetry over integers fails with the message that a symmetry function must have model values as domain and range.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  CONSTANTS A = A
  B = B
  C = C
  SYMMETRY Bad
---*)
---- MODULE function_non_model_values ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x \in 1..2
Next == x' = x
Bad == Permutations({1, 2})
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Symmetry function must have model values as domain and range.
---*)

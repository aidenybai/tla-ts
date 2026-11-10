(*---
description: A SYMMETRY naming a constant parameter reports that it must be a set of permutations.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  CONSTANTS A = A
  B = B
  C = C
  SYMMETRY A
---*)
---- MODULE error_constant_param ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x = A
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The symmetry function A must specify a set of permutations.
---*)

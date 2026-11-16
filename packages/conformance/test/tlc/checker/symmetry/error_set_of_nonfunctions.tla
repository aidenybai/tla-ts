(*---
description: A SYMMETRY set holding non-functions reports the symmetry-values message.
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
---- MODULE error_set_of_nonfunctions ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x = A
Next == x' = x
Bad == {1, 2}
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The symmetry values must be function records.
---*)

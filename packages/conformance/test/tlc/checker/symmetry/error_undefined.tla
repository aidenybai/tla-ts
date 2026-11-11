(*---
description: A SYMMETRY naming an undefined operator reports it.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTANTS A = A
  B = B
  C = C
  SYMMETRY Nope
---*)
---- MODULE error_undefined ----
EXTENDS Naturals, TLC, FiniteSets
CONSTANTS A, B, C
VARIABLE x
Perms == Permutations({A, B, C})
Init == x = A
Next == x' = x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The symmetry function Nope specified in the configuration file
    is not defined in the specification.
---*)

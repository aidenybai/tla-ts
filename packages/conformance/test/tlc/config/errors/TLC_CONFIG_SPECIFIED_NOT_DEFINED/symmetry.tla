(*---
description: An undefined SYMMETRY is called a symmetry function.
ref: tlc2/tool/impl/Tool.java#getSymmetryPerms
outcome: config-error
config: |
  INIT Init
  NEXT Next
  SYMMETRY Nope
---*)
---- MODULE symmetry ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The symmetry function Nope specified in the configuration file
    is not defined in the specification.
---*)

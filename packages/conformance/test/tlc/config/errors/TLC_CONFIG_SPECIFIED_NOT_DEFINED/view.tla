(*---
description: An undefined VIEW is called a view function.
ref: tlc2/tool/impl/Spec.java#getViewSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
  VIEW Nope
---*)
---- MODULE view ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The view function Nope specified in the configuration file
    is not defined in the specification.
---*)

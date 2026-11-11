(*---
description: A VIEW naming an undefined operator is a config error at startup.
ref: tlc2/tool/impl/Spec.java#getViewSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
  VIEW Nope
---*)
---- MODULE error_undefined ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The view function Nope specified in the configuration file
    is not defined in the specification.
---*)

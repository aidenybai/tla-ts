(*---
description: A VIEW naming a constant fails with the message for a constant.
ref: tlc2/tool/impl/Spec.java#getViewSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTANT C = 1
  VIEW C
---*)
---- MODULE error_constant ----
EXTENDS Naturals, TLC
VARIABLE x
CONSTANT C
Init == x = 0
Next == x' = x
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The view function C cannot be a constant.
---*)

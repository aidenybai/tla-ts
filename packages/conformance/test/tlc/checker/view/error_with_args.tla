(*---
description: A VIEW naming an operator with arguments fails with the message for arguments.
ref: tlc2/tool/impl/Spec.java#getViewSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
  VIEW V
---*)
---- MODULE error_with_args ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
V(a) == a
====

(*--- recorded
all:
  exit: 151
  transcript: "2228:1 TLC requires view function not to take any argument, but one was given: V"
---*)

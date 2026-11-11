(*---
description: An operator with a parameter prints at each call.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_operator_each_call ----
EXTENDS TLC, Naturals
Show(x) == PrintT(x)
Test == Show(1) /\ Show(1)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 1
---*)

(*---
description: "A constant-level definition evaluates to a value, which isn't accepted here: _POSSIBLE K."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE K
---*)
---- MODULE possible ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
K == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The possible K cannot be a constant.
---*)

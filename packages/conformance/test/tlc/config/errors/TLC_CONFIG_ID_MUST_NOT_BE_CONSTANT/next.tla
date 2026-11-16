(*---
description: "A constant-level definition evaluates to a value, which isn't accepted here: NEXT K."
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT Init
  NEXT K
---*)
---- MODULE next ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
K == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The next state action K cannot be a constant.
---*)

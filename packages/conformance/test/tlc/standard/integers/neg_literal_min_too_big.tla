(*---
description: -2147483648 is Neg applied to the numeral 2147483648, which TLC cannot represent.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE neg_literal_min_too_big ----
EXTENDS Integers
Test == -2147483648 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)

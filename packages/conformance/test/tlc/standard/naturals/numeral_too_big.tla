(*---
description: "A numeral past 2^31-1 cannot be represented: TLC says the number is too big."
ref: tlc2/tool/impl/Tool.java#eval
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE numeral_too_big ----
EXTENDS Naturals
Test == 2147483648 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)

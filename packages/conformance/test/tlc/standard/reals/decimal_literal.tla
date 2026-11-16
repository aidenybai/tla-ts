(*---
description: A decimal numeral makes TLC report at startup that it cannot handle real numbers, a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features:
  - Reals
flags:
  - expression
outcome: config-error
---*)
---- MODULE decimal_literal ----
EXTENDS Reals
Test == 1.5 = 1.5
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)

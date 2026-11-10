(*---
description: Even 1.0 is a decimal numeral TLC rejects.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features:
  - Reals
flags:
  - expression
outcome: config-error
---*)
---- MODULE decimal_integral ----
EXTENDS Reals
Test == 1.0 = 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.0
---*)

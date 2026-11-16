(*---
description: A decimal numeral is rejected even where evaluation would never reach it, because the check runs over the parsed spec.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features:
  - Reals
flags:
  - expression
outcome: config-error
---*)
---- MODULE decimal_short_circuited ----
EXTENDS Reals
Test == TRUE \/ 1.5 = 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    1.5
---*)

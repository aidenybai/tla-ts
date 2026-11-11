(*---
description: A decimal numeral parses and is rejected the same way with only Naturals extended.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features:
  - Reals
flags:
  - expression
outcome: config-error
---*)
---- MODULE decimal_without_reals ----
EXTENDS Naturals
Test == 0.5 = 0.5
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2244:1 TLC can't handle real numbers.
    0.5
---*)

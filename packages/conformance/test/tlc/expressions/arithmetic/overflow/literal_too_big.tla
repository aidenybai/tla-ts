(*---
description: "A literal above 2^31 - 1 is rejected at startup."
ref: "tlc2/tool/impl/SpecProcessor.java#NumeralKind"
flags: [expression]
outcome: tlc-error
---*)
---- MODULE literal_too_big ----
EXTENDS Integers
Test == 2147483648 = 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)

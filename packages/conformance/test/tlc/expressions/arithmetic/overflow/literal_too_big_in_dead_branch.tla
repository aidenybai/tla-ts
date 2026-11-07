(*---
description: "A literal above 2^31 - 1 fails even in a branch that never runs, because every numeral is processed at startup."
ref: "tlc2/tool/impl/SpecProcessor.java#NumeralKind"
flags: [expression]
outcome: tlc-error
---*)
---- MODULE literal_too_big_in_dead_branch ----
EXTENDS Integers
Test == IF FALSE THEN 2147483648 = 0 ELSE TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2265:1 TLC can't handle a number this big.
    2147483648
---*)

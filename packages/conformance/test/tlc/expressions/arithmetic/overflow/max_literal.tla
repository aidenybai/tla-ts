(*---
description: "2^31 - 1 is the largest literal."
ref: "tlc2/tool/impl/SpecProcessor.java#NumeralKind"
flags: [expression]
outcome: success
---*)
---- MODULE max_literal ----
EXTENDS Integers
Test == 2147483647 - 1 = 2147483646
====

(*--- recorded
all:
  exit: 0
---*)

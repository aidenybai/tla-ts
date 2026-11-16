(*---
description: "A hexadecimal literal up to 2^31 - 1 is accepted."
ref: "tlc2/tool/impl/SpecProcessor.java#NumeralKind"
flags: [expression]
outcome: success
---*)
---- MODULE hex_literal ----
EXTENDS Integers
Test == \h7FFFFFFF = 2147483647 /\ \H1f = 31
====

(*--- recorded
all:
  exit: 0
---*)

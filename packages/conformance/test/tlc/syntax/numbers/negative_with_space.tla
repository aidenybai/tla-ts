(*---
description: Space between prefix minus and its operand is fine.
ref: "tla2sany/parser/Operators.java#getMixfix"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE negative_with_space ----
EXTENDS Integers
Test == - 1 + 2 = 1
====

(*--- recorded
all:
  exit: 0
---*)

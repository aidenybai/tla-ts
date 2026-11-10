(*---
description: "A definition with parameters does not run at startup."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: success
---*)
---- MODULE parameterized_definition_not_at_startup ----
EXTENDS Integers, TLC
Unused(a) == PrintT(a)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)

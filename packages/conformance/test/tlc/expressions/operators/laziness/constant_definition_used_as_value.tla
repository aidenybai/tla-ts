(*---
description: "A zero-argument definition is a value usable in expressions."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE constant_definition_used_as_value ----
EXTENDS Integers
K == 3
Test == K + K = 6
====

(*--- recorded
all:
  exit: 0
---*)

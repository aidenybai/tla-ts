(*---
description: "A definition with no self-reference that fails to build at startup keeps no value, and FcnApply then builds it lazily, so only the applied argument runs."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstantDefns"
flags: [expression]
outcome: success
---*)
---- MODULE nonrecursive_failing_definition_stays_lazy ----
EXTENDS Integers
F[n \in 0..2] == IF n = 2 THEN 1 \div 0 ELSE n
Test == F[1] = 1
====

(*--- recorded
all:
  exit: 0
---*)

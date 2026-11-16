(*---
description: "Functions with domains 2..3 and {2, 3} are equal."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE enum_domain_vs_interval_at_other_low ----
EXTENDS Integers
Test == [x \in {2, 3} |-> x] = [x \in 2..3 |-> x]
====

(*--- recorded
all:
  exit: 0
---*)

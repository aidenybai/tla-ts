(*---
description: "Functions on two empty intervals are equal."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empty_interval_low_ignored ----
EXTENDS Integers
Test == [x \in 3..1 |-> 0] = [x \in 9..1 |-> 0]
====

(*--- recorded
all:
  exit: 0
---*)

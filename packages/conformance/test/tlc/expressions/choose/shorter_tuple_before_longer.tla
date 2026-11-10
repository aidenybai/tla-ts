(*---
description: "Normalized order compares tuples by length first, so a shorter tuple wins even when its first component is larger."
ref: "tlc2/value/impl/TupleValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE shorter_tuple_before_longer ----
EXTENDS Integers
Test == (CHOOSE x \in {<<1, 1>>, <<2>>} : TRUE) = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)

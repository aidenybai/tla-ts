(*---
description: "S \\subseteq T between intervals decides by bounds without enumerating when it holds."
ref: "tlc2/value/impl/IntervalValue.java#isSubsetEq"
flags: [expression]
outcome: success
---*)
---- MODULE subseteq_interval_fast_path ----
EXTENDS Integers
Test == (1..2147483646) \subseteq (0..2147483647)
====

(*--- recorded
all:
  exit: 0
---*)

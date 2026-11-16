(*---
description: "An empty interval is a subset of any set."
ref: "tlc2/value/impl/EnumerableValue.java#isSubsetEq"
flags: [expression]
outcome: success
---*)
---- MODULE subseteq_empty_interval_of_enum ----
EXTENDS Integers
Test == (2..1) \subseteq {} /\ (2..1) \subseteq Nat
====

(*--- recorded
all:
  exit: 0
---*)

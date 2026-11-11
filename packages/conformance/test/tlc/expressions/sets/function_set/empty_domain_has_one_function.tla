(*---
description: "[{} -> T] is {<<>>} whatever T is."
ref: "tlc2/value/impl/SetOfFcnsValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE empty_domain_has_one_function ----
EXTENDS Integers, FiniteSets
Test == [{} -> {1}] = {<<>>} /\ Cardinality([{} -> Nat]) = 1
====

(*--- recorded
all:
  exit: 0
---*)

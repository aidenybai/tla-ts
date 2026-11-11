(*---
description: "An empty field set makes the set of records empty."
ref: "tlc2/value/impl/SetOfRcdsValue.java#isEmpty"
flags: [expression]
outcome: success
---*)
---- MODULE empty_field_is_empty ----
EXTENDS Integers, FiniteSets
Test == [a : {}, b : {1}] = {} /\ Cardinality([a : {1}, b : {}]) = 0
====

(*--- recorded
all:
  exit: 0
---*)

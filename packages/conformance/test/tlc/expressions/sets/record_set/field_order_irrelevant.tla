(*---
description: "Two sets of records with reordered fields are equal."
ref: "tlc2/value/impl/SetOfRcdsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE field_order_irrelevant ----
EXTENDS Integers
Test == [a : {1}, b : {2}] = [b : {2}, a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)

(*---
description: "A set of records equals the enumerated set of its records."
ref: "tlc2/value/impl/SetOfRcdsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equals_enum ----
EXTENDS Integers
Test == [a : {1, 2}] = {[a |-> 2], [a |-> 1]}
====

(*--- recorded
all:
  exit: 0
---*)

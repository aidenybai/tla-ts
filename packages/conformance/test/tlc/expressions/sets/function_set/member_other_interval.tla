(*---
description: "A function on 2..3 belongs to the function set with that domain, and to no other."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_other_interval ----
EXTENDS Integers
Test == [i \in 2..3 |-> 0] \in [2..3 -> {0}] /\ [i \in 2..3 |-> 0] \notin [1..2 -> {0}]
====

(*--- recorded
all:
  exit: 0
---*)

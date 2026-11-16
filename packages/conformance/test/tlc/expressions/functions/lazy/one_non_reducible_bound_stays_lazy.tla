(*---
description: "One non-Reducible bound keeps a multi-bound function lazy."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE one_non_reducible_bound_stays_lazy ----
EXTENDS Integers
Test == <<1, 5>> \in DOMAIN [x \in 1..2, y \in Nat |-> 1 \div 0]
====

(*--- recorded
all:
  exit: 0
---*)

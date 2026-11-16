(*---
description: Evaluates a random record expression, seed 262, number 4797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([DOMAIN [[b7484 \in Nat |-> b7484] EXCEPT ![[a |-> 7, b |-> TRUE]] = (-2147483647)] EXCEPT !.a = @ + (Cardinality({b7485 : b7485 \in {2, 1, 3}}) \div (\E b7486 \in {0, 7} : (\E b7487 \in {} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04797 failed.
    2158:0 Attempted to check if the value:
    [a |-> 7, b |-> TRUE]
    is an element of Nat.
---*)

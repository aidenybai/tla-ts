(*---
description: Evaluates a random record expression, seed 262, number 3007.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([a |-> Cardinality({1, 2}), b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])]).a, b |-> (((2..1 \subseteq {x \in 1..3 : x > 1}) /\ (\A b4780 \in {1} : FALSE)) /\ (\A b4781 \in (Nat \ {2, 1, 3}) : (-1 \in SUBSET {1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> FALSE]"
---*)

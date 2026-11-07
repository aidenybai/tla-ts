(*---
description: Evaluates a random record expression, seed 262, number 9989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a, b |-> (((2147483647 - 7) \in (0 .. 2)) => ({b15525 \in 2..1 : FALSE} \subseteq [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 7]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> TRUE]"
---*)

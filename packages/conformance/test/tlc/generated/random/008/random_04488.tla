(*---
description: Evaluates a random int expression, seed 262, number 4488.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04488 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((TRUE /\ FALSE) /\ ([a |-> 1] = [a |-> 1])) => ((FALSE => FALSE) \/ ({1, 2} = 1..3))) -> (<<([a |-> 1, b |-> TRUE]).a, ({x \in 1..3 : x > 1} \cap {1, 2})>>)[Len(<<1, 1>>)] [] OTHER -> Len(Tail((CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)

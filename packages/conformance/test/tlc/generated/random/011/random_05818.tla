(*---
description: Evaluates a random bool expression, seed 262, number 5818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b8966 \in ({1, 2} \cap {1}) : (\A b8967 \in SUBSET {1} : FALSE)) => ((3 * 1) \in DOMAIN [x \in 1..2 |-> x])) /\ (\E b8968 \in {Cardinality(Nat) : b8969 \in (2..1 \ SUBSET {1})} : ((FALSE \/ TRUE) \/ (FALSE \/ [a |-> 1])))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

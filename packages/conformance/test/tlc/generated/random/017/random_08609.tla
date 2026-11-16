(*---
description: Evaluates a random set expression, seed 262, number 8609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN (1 :> 2) \ ({1} \cup SUBSET {1})) \cap DOMAIN (2 :> 1)) \cup ({b13335 \in {[a |-> 1, b |-> TRUE] : b13336 \in 2..1} : (0 \in Nat)} \cap ((Nat \cup 1..3) \cap (2..1 \ 1..3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

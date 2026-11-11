(*---
description: Evaluates a random set expression, seed 262, number 3696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality({b5840, b5840}) : b5840 \in {b5841 \in DOMAIN [x \in 1..2 |-> x] : (1..3 \subseteq {x \in 1..3 : x > 1})}} \cap ((UNION {{1, 2}, Nat} \cup (SUBSET {1} \cup {})) \ ((Nat \ {2, 1, 3}) \ ({2, 1, 3} \cap {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

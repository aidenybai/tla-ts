(*---
description: Evaluates a random bool expression, seed 262, number 1700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(<<0, 1>>, LAMBDA p, q : p < q) = [b2711 \in DOMAIN [x \in 1..2 |-> x] |-> (b2711 - b2711)]) \/ (((1..3 = 2..1) <=> (2..1 \subseteq 1..3)) /\ ((-1 < -1) /\ (~FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

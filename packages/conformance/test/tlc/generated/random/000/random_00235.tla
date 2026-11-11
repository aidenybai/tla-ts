(*---
description: Evaluates a random bool expression, seed 262, number 235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b389 \in {1, 2} : FALSE} \ UNION {2..1, [a |-> 1, b |-> TRUE]}) \subseteq ((Nat \cap {x \in 1..3 : x > 1}) \ (2 .. -1))) \/ (IF (2 \in {2, 1, 3}) THEN Head(<<>>) ELSE (3 - -1) \in {Cardinality(Nat), IF FALSE THEN 1 ELSE 1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

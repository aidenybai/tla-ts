(*---
description: Evaluates a random bool expression, seed 262, number 5023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((~FALSE) => (2147483647 = 0)) \/ (Cardinality(2..1) \in {-1 : b7815 \in {1, 2}})) /\ (((<<5, 6>> @@ [x \in 1..2 |-> x]) = (<<5, 6>> @@ <<5, 6>>)) /\ (UNION {{1}, [a |-> 1]} \subseteq (<<1, 2>> \cap {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

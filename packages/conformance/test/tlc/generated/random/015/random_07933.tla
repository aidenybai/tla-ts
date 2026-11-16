(*---
description: Evaluates a random set expression, seed 262, number 7933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12247 \in UNION {{1 : b12248 \in {x \in 1..3 : x > 1}}, {7, 0}} : (SortSeq(<<>>, LAMBDA p, q : p < q) = (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE))} \ {b12249 \in (({1, 2} \ {x \in 1..3 : x > 1}) \cap (Nat \cup {1, 2})) : (([x \in 1..2 |-> x])[1] = Head(<<1, 2>>))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

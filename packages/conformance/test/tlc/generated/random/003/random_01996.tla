(*---
description: Evaluates a random bool expression, seed 262, number 1996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b3159 \in {Cardinality({1, 2}) : b3160 \in ({} \cap {2, 1, 3})} : (([a |-> 1, b |-> TRUE] = [a |-> 1]) <=> (\A b3161 \in {1} : TRUE))) <=> (\E b3162 \in ((2147483647 .. 1) \ DOMAIN [x \in 1..2 |-> x]) : ((\A b3163 \in {1, 2} : FALSE) <=> (1 = b3162)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

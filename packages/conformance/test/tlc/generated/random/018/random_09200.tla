(*---
description: Evaluates a random function expression, seed 262, number 9200.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09200 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14277 \in {b14278 \in (({1, 2} \cup {1, 2}) \ ({2, 1, 3} \ Nat)) : ((-1 + 0) \in DOMAIN [x \in 1..2 |-> x])} |-> ((-([a |-> 1]).a) \div ((2 % b14277) + SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

(*---
description: Evaluates a random record expression, seed 262, number 5857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)), b |-> (\A b9039 \in {([x \in 1..2 |-> x])[b9040] : b9040 \in ({x \in 1..3 : x > 1} \ Nat)} : (CASE TRUE -> b9039 [] OTHER -> 2 < CASE TRUE -> 2 [] OTHER -> 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3, b |-> TRUE]"
---*)

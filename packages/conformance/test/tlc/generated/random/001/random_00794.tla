(*---
description: Evaluates a random bool expression, seed 262, number 794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (({2, 1, 3} \cap {x \in 1..3 : x > 1}) = {{1, 2} : b1306 \in {1, 2}}) -> Cardinality((Nat \cap 1..3)) [] OTHER -> Head(Append(<<1, 2>>, 0)) < (((2147483647 - 3) % (2 + 3)) - IF (~FALSE) THEN Len(<<3, 1, 2>>) ELSE (7 % 2147483647))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

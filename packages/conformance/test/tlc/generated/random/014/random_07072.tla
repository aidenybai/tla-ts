(*---
description: Evaluates a random bool expression, seed 262, number 7072.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07072 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b10864 \in UNION {({} \ {2, 1, 3}), {2, 0}} : ((0 \in {1}) <=> (\E b10865 \in {1, 2} : FALSE))) \/ (Append(<<7, 7>>, (2147483647 + -1)) = ((3 + 1) :> (-FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

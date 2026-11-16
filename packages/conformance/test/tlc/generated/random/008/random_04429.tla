(*---
description: Evaluates a random bool expression, seed 262, number 4429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((3 * 3) \in ({x \in 1..3 : x > 1} \cap 2..1)) \/ (\E b6968 \in {b6969 : b6969 \in 2..1} : ([x \in 1..2 |-> x] => TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

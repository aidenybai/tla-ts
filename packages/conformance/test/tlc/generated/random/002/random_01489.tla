(*---
description: Evaluates a random bool expression, seed 262, number 1489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\A b2380 \in (2..1 \ 1..3) : [[a |-> 1, b |-> TRUE] EXCEPT !.a = b2380]) \/ ((<<1, 2>> = [x \in 1..2 |-> x]) \/ (7 < 3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

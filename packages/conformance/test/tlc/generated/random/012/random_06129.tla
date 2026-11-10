(*---
description: Evaluates a random bool expression, seed 262, number 6129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SelectSeq(<<1>>, LAMBDA e : e > 0) = [b9426 \in 2..1 |-> 3]) \/ ((2..1 \cap {}) = ({x \in 1..3 : x > 1} \cap 2..1))) => ((Len(<<3, 1, 2>>) - IF FALSE THEN 3 ELSE 2) < ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

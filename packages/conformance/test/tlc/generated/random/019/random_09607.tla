(*---
description: Evaluates a random bool expression, seed 262, number 9607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq(Tail(TRUE), LAMBDA e : e > 0), IF (\A b14916 \in SUBSET {1} : FALSE) THEN Head(<<1, 2>>) ELSE (CHOOSE b14917 \in {2, 1, 3} : TRUE), ([(1 :> 2) EXCEPT ![-1] = 1] @@ (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))) = [b14918 \in UNION {{b14919 \in {} : FALSE}, (0 .. 1)} |-> (Head(<<1>>) \div ([x \in 1..2 |-> x])[b14918])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)

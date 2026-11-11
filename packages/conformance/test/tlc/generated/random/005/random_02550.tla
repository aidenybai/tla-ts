(*---
description: Evaluates a random function expression, seed 262, number 2550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o Append(<<1, 2>>, 7)), ((0 < 0) \/ (TRUE /\ FALSE)), ([3 EXCEPT ![1] = 3])[([x \in Nat |-> x + 1])[1]]), SelectSeq(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (3 - 2147483647), (FALSE % 1)), LAMBDA e : e > 0), (-([[x \in Nat |-> x + 1] EXCEPT ![0] = 7])[(7 + 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02550 failed.
    Attempted to apply EXCEPT construct to the value 3.
---*)

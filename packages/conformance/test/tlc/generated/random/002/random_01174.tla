(*---
description: Evaluates a random seq expression, seed 262, number 1174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append([[x \in 1..2 |-> x] EXCEPT ![1] = 2], (2 % 2147483647)) \o SortSeq(SubSeq(<<3, 1, 2>>, 3, 2), LAMBDA p, q : p < q)) \o [SelectSeq((1..3 \subseteq <<3, 1, 2>>), LAMBDA e : e > 0) EXCEPT ![1] = Head([<<3, 1, 2>> EXCEPT ![1] = 1])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01174 failed.
    Attempted to check set membership in a tuple value.
---*)

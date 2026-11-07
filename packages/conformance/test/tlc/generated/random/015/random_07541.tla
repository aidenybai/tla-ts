(*---
description: Evaluates a random int expression, seed 262, number 7541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11625 \in {((7 % 0) :> CASE 1 -> 2147483647 [] OTHER -> 7), Len(Append(<<>>, 7))} : (SortSeq(Append(<<1, 2>>, 2), LAMBDA p, q : p < q) = [b11626 \in {b11627 : b11627 \in {}} |-> (1 \div b11626)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

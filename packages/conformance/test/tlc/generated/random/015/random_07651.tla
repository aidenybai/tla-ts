(*---
description: Evaluates a random function expression, seed 262, number 7651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11775 \in {(Len(2147483647) + LET b11776 == 2 IN b11776), (-CASE FALSE -> 2 [] OTHER -> 2)} |-> (((3 % b11775) \div (b11775 \div b11775)) * Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
---*)

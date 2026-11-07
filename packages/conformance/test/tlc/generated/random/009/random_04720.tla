(*---
description: Evaluates a random seq expression, seed 262, number 4720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SelectSeq(Append(2147483647, -1), LAMBDA e : e > 0)) EXCEPT ![1] = ((Head(<<>>) \div (-1 * 2147483647)) - Len(SortSeq(<<>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2147483647
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2147483647
---*)

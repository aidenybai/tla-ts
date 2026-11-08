(*---
description: Evaluates a random seq expression, seed 262, number 6998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SelectSeq((<<>> \o [x \in 1..2 |-> x]), LAMBDA e : e > 0), LET b10721 == (7 + 7) IN (3 :> b10721), Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) EXCEPT ![1] = (((2147483647 \div 7) \div (<<5, 6>>)[0]) - (-(CHOOSE b10722 \in {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06998 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    (3 :> 14)
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 8857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(((<<2, 7>> \o {b13722 \in 2..1 : TRUE}) \o Tail(SortSeq(<<>>, LAMBDA p, q : p < q))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
---*)

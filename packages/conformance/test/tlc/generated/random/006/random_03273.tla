(*---
description: Evaluates a random seq expression, seed 262, number 3273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([(<<>> \o {x \in 1..3 : x > 1}) EXCEPT ![1] = IF TRUE THEN 7 ELSE 0], LAMBDA p, q : p < q) \o SelectSeq(<<Len(<<>>), (3 \div 1)>>, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {2, 3}
---*)

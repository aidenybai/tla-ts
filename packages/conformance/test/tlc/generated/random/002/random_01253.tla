(*---
description: Evaluates a random seq expression, seed 262, number 1253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SortSeq(Append(<<3, 1, 2>>, 2147483647), LAMBDA p, q : p < q), Cardinality(DOMAIN <<3, 1, 2>>), (Cardinality(TRUE) \div (TRUE <=> FALSE))) EXCEPT ![1] = ((DOMAIN (1 :> 2) \cap {b2004 \in {1, 2} : TRUE}) + ((1..3 \ {x \in 1..3 : x > 1}) - ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)

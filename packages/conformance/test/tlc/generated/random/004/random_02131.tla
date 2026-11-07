(*---
description: Evaluates a random int expression, seed 262, number 2131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE), (1..3 \ {x \in 1..3 : x > 1})) \o SortSeq((<<>> \o <<3, 1, 2>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    (2 :> 1)
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    (2 :> 1)
---*)

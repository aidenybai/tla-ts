(*---
description: Evaluates a random record expression, seed 262, number 7301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((((1 :> 2))[TRUE] + Len(<<1>>)) .. Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))), b |-> SelectSeq([(<<1, 2>> \o {x \in 1..3 : x > 1}) EXCEPT ![1] = Head(<<1, 2>>)], LAMBDA e : e > 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07301 failed.
    Attempted to check equality of integer 1 with non-integer:
    TRUE
---*)

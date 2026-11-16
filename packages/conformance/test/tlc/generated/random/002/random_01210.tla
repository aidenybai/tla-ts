(*---
description: Evaluates a random set expression, seed 262, number 1210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<IF TRUE THEN 7 ELSE 7, Len(<<1, 2>>)>> EXCEPT ![1] = ([a |-> 2, b |-> FALSE]).a] \o (((-3) :> (-2)) \o SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01210 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    (-3 :> -2)
---*)

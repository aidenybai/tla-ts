(*---
description: Evaluates a random seq expression, seed 262, number 7085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([SelectSeq((<<1>> \o <<1, 2>>), LAMBDA e : e > 0) EXCEPT ![1] = (LET b10879 == -1 IN 2 :> LET b10880 == 3 IN b10880)], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07085 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    (2 :> 3)
---*)

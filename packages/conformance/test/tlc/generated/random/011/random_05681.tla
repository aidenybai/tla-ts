(*---
description: Evaluates a random function expression, seed 262, number 5681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT !.a = @ + (([[a |-> 1] EXCEPT !.a = @ + 2] :> (1 % -1)))[(IF FALSE THEN 3 ELSE 0 + (0 \div 7))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05681 failed.
    Attempted to access tuple at a non integral index: "a"
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 3143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)) \o SelectSeq((CHOOSE r \in [a : {0} \cup {1}] : TRUE), LAMBDA e : e > 0)), (-LET b5020 == LET b5021 == 7 IN 7 IN (3 * 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03143 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 0]
---*)

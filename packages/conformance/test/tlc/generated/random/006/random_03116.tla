(*---
description: Evaluates a random int expression, seed 262, number 3116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq([Tail(FALSE) EXCEPT ![1] = (2 % 2)], LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b4979 \in (UNION {SUBSET {1}, 1..3} \cap (2147483647 .. 2147483647)) : ((<<1, 2>> \o <<>>) = [<<5, 6>> EXCEPT ![b4979] = b4979]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03116 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)

(*---
description: Evaluates a random int expression, seed 262, number 8438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Head(FALSE) : b13059 \in {7 : b13060 \in {1, 2}}} = ([[a |-> 1] EXCEPT !.a = 0] \cup {2147483647, -1})) * (({7, 7} \cap {1 : b13061 \in (1 :> 2)}) = ((7 .. 0) \cup (-1 .. 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08438 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)

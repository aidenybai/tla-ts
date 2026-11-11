(*---
description: Evaluates a random int expression, seed 262, number 9211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail([<<>> EXCEPT ![1] = 1])) \div (IF (TRUE <=> FALSE) THEN ([a |-> 1]).a ELSE ({1} \cap {1, 2}) - IF (-1 = 3) THEN LET b14297 == 7 IN b14297 ELSE (0 \div 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 30 of module random_09211
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09211 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Tail([<<>> EXCEPT ![1] = 7]), ((3 - 0) % (0 \div 1)), (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) < LET b1187 == (LET b1188 == 3 IN 2 + (0 * 3)) IN ((-0) % (-b1187))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 33 of module random_00721
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

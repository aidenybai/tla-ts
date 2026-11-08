(*---
description: Evaluates a random seq expression, seed 262, number 9781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(Tail(<<>>), LAMBDA p, q : p < q), LET b15186 == (3 \div 2147483647) IN IF FALSE THEN 3 ELSE 2) \o [[[<<1, 2>> EXCEPT ![1] = 3] EXCEPT ![1] = IF FALSE THEN 0 ELSE 0] EXCEPT ![1] = (Len(<<3, 1, 2>>) - (0 \div 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09781 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

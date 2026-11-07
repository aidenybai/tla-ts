(*---
description: Evaluates a random seq expression, seed 262, number 6057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Tail([<<>> EXCEPT ![1] = 3]) EXCEPT ![1] = ((-1 - 7) \div Len(<<1, 2>>))] \o Tail(((3 = 2147483647) \/ (TRUE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 27 of module random_06057
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

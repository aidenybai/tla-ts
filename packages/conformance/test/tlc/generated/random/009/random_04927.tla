(*---
description: Evaluates a random seq expression, seed 262, number 4927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Tail(<<>>) \o Append([x \in 1..2 |-> x], -1)) \o SelectSeq([<<1, 2>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0)) \o SelectSeq((Append(<<1>>, 2147483647) \o <<3, 2147483647>>), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04927 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

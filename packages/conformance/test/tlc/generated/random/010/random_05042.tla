(*---
description: Evaluates a random seq expression, seed 262, number 5042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o Append([<<3, 1, 2>> EXCEPT ![1] = 1], Len(<<1, 2>>))) EXCEPT ![1] = ([b7837 \in ({2, 1, 3} \cap {}) |-> SortSeq(<<>>, LAMBDA p, q : p < q)])[CASE (\E b7838 \in {1} : [a |-> 1]) -> ([a |-> 1]).a [] OTHER -> (3 % SUBSET {1})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05042 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 234 to line 14, col 261 of module random_05042
---*)

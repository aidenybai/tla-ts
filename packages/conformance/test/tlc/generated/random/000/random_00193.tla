(*---
description: Evaluates a random set expression, seed 262, number 193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Len(<<1, 2>>) \div (<<1, 2>> * 3)) \div Head(SortSeq(<<>>, LAMBDA p, q : p < q))) : b314 \in UNION {{LET b316 == 7 IN 0 : b315 \in (SUBSET {1} \cap {2, 1, 3})}, (({} \cup {2, 1, 3}) \cup UNION {{2, 1, 3}, {1}})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00193 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)

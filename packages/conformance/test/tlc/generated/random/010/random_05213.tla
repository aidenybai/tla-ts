(*---
description: Evaluates a random int expression, seed 262, number 5213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (SortSeq(<<>>, LAMBDA p, q : p < q) = [b8088 \in SUBSET {1} |-> 2]) THEN IF (TRUE <=> TRUE) THEN (-1 + 3) ELSE ([x \in 1..2 |-> x])[-1] ELSE (Head(<<3, 1, 2>>) * (1 * 3)) - ((Len(<<1>>) + ([a |-> 1]).a) + ((3 :> 7))[([a |-> 1]).a])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05213 failed.
    Attempted to apply function:
    (3 :> 7)
    to argument 1, which is not in the domain of the function.
---*)

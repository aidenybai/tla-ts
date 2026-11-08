(*---
description: Evaluates a random bool expression, seed 262, number 9660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {UNION {{1}, {x \in 1..3 : x > 1}}, [a |-> -1, b |-> TRUE]}, {(-b14998) : b14998 \in ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})}} \subseteq SubSeq((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o SortSeq(<<>>, LAMBDA p, q : p < q)), (({x \in 1..3 : x > 1} = {1, 2}) => [b14999 \in SUBSET {1} |-> b14999]), Cardinality([[x \in 1..2 |-> x] EXCEPT ![7] = 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 346 to line 14, col 363 of module random_09660
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09660 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)

(*---
description: Evaluates a random set expression, seed 262, number 7218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {{b11091 : b11091 \in {1}}, {b11092 \in {2, 1, 3} : FALSE}}, SubSeq([(1 :> 2) EXCEPT ![1] = 7], LET b11093 == 2 IN b11093, Cardinality({x \in 1..3 : x > 1}))} \cup (CASE (~FALSE) -> (-0) [] OTHER -> LET b11094 == 0 IN 0 \cap ((2..1 \cup {1, 2}) \ ({1} \ {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07218 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<7>>
    , but instead it is
    2
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 2622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append([[<<>> EXCEPT ![1] = 3] EXCEPT ![1] = (<<5, 6>>)[7]], CASE ([a |-> 1, b |-> TRUE] \subseteq 2..1) -> LET b4128 == 7 IN 2 [] OTHER -> Cardinality(SUBSET {1})) \o Tail(((FALSE \/ FALSE) \/ (SUBSET {1} = 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 29 of module random_02622
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 46 of module random_02622
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02622 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 84 to line 14, col 119 of module random_02622
---*)

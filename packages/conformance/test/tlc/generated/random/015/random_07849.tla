(*---
description: Evaluates a random bool expression, seed 262, number 7849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b12128 == Cardinality((UNION {{x \in 1..3 : x > 1}, {}} \ {(1 :> 2), 0})) IN (([[a |-> 1, b |-> TRUE] EXCEPT !.a = b12128]).a \div ((b12128 :> 3))[(b12128 * b12128)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07849 failed.
    Attempted to check equality of the function <<2>> with the value:
    2
---*)

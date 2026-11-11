(*---
description: Evaluates a random function expression, seed 262, number 290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {}] : TRUE) @@ [b487 \in (DOMAIN [x \in 1..2 |-> x] \cup ({2, 1, 3} \ Nat)) |-> IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN Len(<<1>>) ELSE IF FALSE THEN b487 ELSE b487]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00290 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_00290
---*)

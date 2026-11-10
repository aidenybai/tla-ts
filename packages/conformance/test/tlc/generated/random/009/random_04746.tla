(*---
description: Evaluates a random set expression, seed 262, number 4746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{IF (~TRUE) THEN Len(<<>>) ELSE ([x \in Nat |-> x + 1])[2], Len(Tail(<<3, 1, 2>>))}, (UNION {(CHOOSE r \in [a : {}] : TRUE), ({x \in 1..3 : x > 1} \cup 2..1)} \ {(2147483647 % 7), (-7)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04746 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 117 to line 14, col 144 of module random_04746
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 6134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<((1 % 2147483647) :> ([a |-> 1]).a), IF (1 < 2147483647) THEN Head(<<1, 2>>) ELSE (7 * 2)>>, (((CHOOSE r \in [a : 2..1] : TRUE) = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)) % Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06134 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 121 to line 14, col 150 of module random_06134
---*)

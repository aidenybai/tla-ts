(*---
description: Evaluates a random function expression, seed 262, number 3349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((-2147483647) * Head(<<1>>)) :> (LET b5320 == 3 IN 0 - IF FALSE THEN -1 ELSE -1)) EXCEPT ![(CHOOSE r \in [a : 2..1] : TRUE)] = SortSeq(SelectSeq(Append(<<1, 2>>, 2), LAMBDA e : e > 0), LAMBDA p, q : p < q)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03349 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 111 to line 14, col 140 of module random_03349
---*)

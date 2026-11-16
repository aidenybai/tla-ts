(*---
description: Evaluates a random function expression, seed 262, number 4579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7180 \in {b7181 : b7181 \in {}} : (b7180 < 2147483647)) * (IF TRUE THEN 3 ELSE 2147483647 % IF FALSE THEN 7 ELSE {})) :> Head((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o Append(<<>>, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04579 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 80 of module random_04579
---*)

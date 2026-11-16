(*---
description: Evaluates a random function expression, seed 262, number 4655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SelectSeq(<<{x \in 1..3 : x > 1}, 7>>, LAMBDA e : e > 0), (-SelectSeq(<<>>, LAMBDA e : e > 0))), IF (({2, 1, 3} = FALSE) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) THEN (-Head(<<1, 2>>)) ELSE IF (-1 + 3) THEN ([x \in 1..2 |-> x])[2147483647] ELSE (CHOOSE b7281 \in {x \in 1..3 : x > 1} : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04655 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    {2, 3}
---*)

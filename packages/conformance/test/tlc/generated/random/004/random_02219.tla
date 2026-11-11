(*---
description: Evaluates a random bool expression, seed 262, number 2219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (~{b3495 \in {x \in 1..3 : x > 1} : FALSE}) THEN ((-1 \div 0) \div LET b3496 == 3 IN 3) ELSE Head(Append(<<>>, 1)) = ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02219 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form {e1, ... ,eN})
    line 14, col 21 to line 14, col 61 of module random_02219
---*)

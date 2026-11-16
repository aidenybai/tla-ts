(*---
description: Evaluates a random function expression, seed 262, number 4866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7579 \in DOMAIN <<5, 6>> : (\E b7580 \in {1} : FALSE)) \div Len(Append(<<3, 1, 2>>, -1))) :> ((CHOOSE r \in [a : 2..1] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04866 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 79 of module random_04866
---*)

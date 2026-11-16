(*---
description: Evaluates a random int expression, seed 262, number 8716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(((<<1>> \o <<>>) \o Append(<<1, 2>>, 3))) - (CHOOSE b13496 \in ({2, 0} \cup (-1 .. 0)) : ((CHOOSE r \in [a : {}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08716 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 113 to line 14, col 140 of module random_08716
---*)

(*---
description: Evaluates a random set expression, seed 262, number 3200.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03200 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + ((1 :> 2))[7]]).a .. (-Len(Append(<<1, 2>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03200 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_03200
---*)

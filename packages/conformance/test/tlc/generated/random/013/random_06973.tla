(*---
description: Evaluates a random function expression, seed 262, number 6973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10668 \in ((7 .. 2147483647) \cap ({1, 2} \ {x \in 1..3 : x > 1})) : ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [[a |-> 1] EXCEPT !.a = -1])) :> ((CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE))[Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), Cardinality(2..1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06973 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 166 of module random_06973
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 5450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SortSeq((1..3 \cap {}), LAMBDA p, q : p < q), ((7 + 7) % (7 - 2))), LET b8442 == ([a |-> 1, b |-> TRUE]).a IN (((1 :> 2) @@ (1 :> 2)))[([a |-> 1]).a], (-(CHOOSE b8443 \in (7 .. 7) : (FALSE => [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05450 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {}
---*)

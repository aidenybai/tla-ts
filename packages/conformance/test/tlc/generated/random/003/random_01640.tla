(*---
description: Evaluates a random seq expression, seed 262, number 1640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq([[<<1, 2>> EXCEPT ![1] = 7] EXCEPT ![1] = IF TRUE THEN <<1, 2>> ELSE 2], (-([x \in 1..2 |-> x])[3]), Cardinality({2, -1})), ([[<<5, 6>> EXCEPT !.a = 3] EXCEPT !.a = @ + (<<5, 6>>)[2]]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01640 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 7383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<([b11369 \in {1} |-> b11369])[(0 + 2)], [(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (CHOOSE b11370 \in 2..1 : FALSE)]>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07383 failed.
    In applying the function
    <<1>>,
    the first argument is:
    2
    which is not in its domain.
---*)

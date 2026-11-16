(*---
description: Evaluates a random seq expression, seed 262, number 8649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(SortSeq(Append(<<1>>, 2147483647), LAMBDA p, q : p < q), (([x \in 1..2 |-> x])[-1] - (CHOOSE b13384 \in {x \in 1..3 : x > 1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08649 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

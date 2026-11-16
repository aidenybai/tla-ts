(*---
description: Evaluates a random seq expression, seed 262, number 2304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(-([b3639 \in {1} |-> 2147483647])[(0 * 1)]) EXCEPT ![1] = CASE ((<<1>> = <<5, 6>>) => (SUBSET {1} = {2, 1, 3})) -> Len(([x \in 1..2 |-> x] @@ [a |-> 1, b |-> TRUE])) [] OTHER -> Len([<<1, 2>> EXCEPT ![1] = 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02304 failed.
    In applying the function
    <<2147483647>>,
    the first argument is:
    0
    which is not in its domain.
---*)

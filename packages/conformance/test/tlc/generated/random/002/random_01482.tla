(*---
description: Evaluates a random set expression, seed 262, number 1482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len([SubSeq(<<3, 1, 2>>, 2, 2) EXCEPT ![1] = (-2)]), ((([x \in 1..2 |-> x] @@ <<5, 6>>))[(2 * 0)] % (CHOOSE b2371 \in ({x \in 1..3 : x > 1} = {2, 1, 3}) : ([a |-> 1, b |-> TRUE] = <<1>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01482 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 0, which is not in the domain of the function.
---*)

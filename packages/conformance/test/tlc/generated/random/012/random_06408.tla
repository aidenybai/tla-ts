(*---
description: Evaluates a random record expression, seed 262, number 6408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((((1 :> 2) @@ [x \in 1..2 |-> x]))[(1 * 2147483647)] .. Len(SubSeq(<<>>, 2, -1))) EXCEPT !.a = ([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (3 < 0)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06408 failed.
    Attempted to apply function:
    <<2, 2>>
    to argument 2147483647, which is not in the domain of the function.
---*)

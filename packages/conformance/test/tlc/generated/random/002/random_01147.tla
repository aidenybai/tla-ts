(*---
description: Evaluates a random set expression, seed 262, number 1147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((([x \in 1..2 |-> x])[3] * ((1 :> 2))[-1]) .. IF (<<1, 2>> = <<5, 6>>) THEN (7 + 7) ELSE (3 + 1)), (([[a |-> 1] EXCEPT !.a = 3]).a \in {Len(<<>>), ([a |-> 1]).a})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01147 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)

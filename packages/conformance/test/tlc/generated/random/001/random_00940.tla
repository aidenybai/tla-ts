(*---
description: Evaluates a random record expression, seed 262, number 940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(\A b1508 \in ((SUBSET {1} \ 2..1) \ ({1} \ SUBSET {1})) : (\E b1509 \in ([x \in Nat |-> x + 1] @@ <<5, 6>>) : (TRUE <=> TRUE))) EXCEPT !.a = @ + Head([Tail(<<1>>) EXCEPT ![1] = (-7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00940 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)

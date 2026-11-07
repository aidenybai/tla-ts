(*---
description: Evaluates a random function expression, seed 262, number 6572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2 - 2) % ([x \in 1..2 |-> x])[-1]) :> (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) @@ (-1 :> 7))) EXCEPT ![(((-1 % 7) * (-1 + 3)) % ((CHOOSE b10093 \in 2..1 : FALSE) + (CHOOSE b10094 \in SUBSET {1} : FALSE)))] = Len(Tail(([a |-> 1] \o [a |-> 1, b |-> TRUE])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06572 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

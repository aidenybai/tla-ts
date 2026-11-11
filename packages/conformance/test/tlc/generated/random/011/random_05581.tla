(*---
description: Evaluates a random function expression, seed 262, number 5581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b8641 == LET b8642 == Head(<<1>>) IN (-b8642) IN ((b8641 - b8641) - ([x \in 1..2 |-> x])[b8641]) :> (((-1) % (1 % 2)) + LET b8643 == (-1 - 3) IN ([x \in Nat |-> x + 1] \div b8643))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05581 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

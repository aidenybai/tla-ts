(*---
description: Evaluates a random function expression, seed 262, number 6381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{} -> 2..1] : TRUE) EXCEPT ![(Head(<<>>) % ([a |-> 1, b |-> TRUE] + 0))] = (-LET b9813 == 2 IN 2)] EXCEPT ![Len(Tail([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + [a |-> 1, b |-> TRUE]]))] = (CHOOSE f \in [1..2 -> {1, 2}] : TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06381 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

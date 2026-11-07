(*---
description: Evaluates a random record expression, seed 262, number 662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + (CHOOSE b1105 \in {2, 1, 3} : TRUE)] EXCEPT !.a = @ + ((CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE))[Cardinality({1, 2})]] EXCEPT !.a = (((CHOOSE f \in [2..1 -> 2..1] : TRUE))[IF FALSE THEN 2 ELSE 2] * (-Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00662 failed.
    Attempted to apply function:
    <<>>
    to argument 2, which is not in the domain of the function.
---*)

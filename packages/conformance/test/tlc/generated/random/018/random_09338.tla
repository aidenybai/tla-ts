(*---
description: Evaluates a random int expression, seed 262, number 9338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 1, b |-> FALSE] EXCEPT !.a = Len(<<>>)] EXCEPT !.a = CASE (0 \in {x \in 1..3 : x > 1}) -> Head(<<>>) [] OTHER -> ((1 :> 2))[2147483647]] EXCEPT !.a = @ + Len(<<(FALSE \/ FALSE), Cardinality(TRUE)>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09338 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)

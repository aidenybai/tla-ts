(*---
description: Evaluates a random function expression, seed 262, number 5970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len(<<>>) :> Len(<<1>>)) @@ [b9204 \in (2 .. 2) |-> IF FALSE THEN b9204 ELSE b9204]) EXCEPT ![([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = ((1 :> 2))[3]]).a] = (-Cardinality({b9205 : b9205 \in Nat}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05970 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)

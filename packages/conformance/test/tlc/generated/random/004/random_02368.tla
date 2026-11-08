(*---
description: Evaluates a random function expression, seed 262, number 2368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Append(Tail(FALSE), Head(<<1>>)) EXCEPT ![1] = ((7).a - ([a |-> 1]).a)] :> (CHOOSE b3750 \in UNION {({1, 2} \ {}), ((1 :> 2) @@ <<5, 6>>)} : ((CHOOSE b3751 \in {2, 1, 3} : FALSE) = (-1 % b3750)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02368 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)

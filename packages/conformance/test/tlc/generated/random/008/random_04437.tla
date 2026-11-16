(*---
description: Evaluates a random function expression, seed 262, number 4437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6984 \in (LET b6985 == (2..1 - 1) IN LET b6986 == b6985 IN 2 .. ([b6987 \in {} |-> b6987])[((1 :> 2))[3]]) |-> ([[a |-> b6984, b |-> FALSE] EXCEPT !.a = CASE TRUE -> {1} [] OTHER -> b6984]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04437 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)

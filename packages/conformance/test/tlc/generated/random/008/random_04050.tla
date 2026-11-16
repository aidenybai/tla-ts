(*---
description: Evaluates a random record expression, seed 262, number 4050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = CASE (IF [x \in 1..2 |-> x] THEN 2 ELSE 3 < Len(<<3, 1, 2>>)) -> IF (<<>> = [x \in 1..2 |-> x]) THEN Head(<<1>>) ELSE Len(<<>>) [] OTHER -> Head(Tail(<<1>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04050 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 77 to line 14, col 130 of module random_04050
---*)

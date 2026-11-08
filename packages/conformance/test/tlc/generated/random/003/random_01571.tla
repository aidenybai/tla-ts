(*---
description: Evaluates a random seq expression, seed 262, number 1571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([Append(SelectSeq([a |-> 1], LAMBDA e : e > 0), (-1)) EXCEPT !.a = @ + (-(CHOOSE b2513 \in {1, 2} : TRUE))], ([({x \in 1..3 : x > 1} = Nat) EXCEPT !.a = CASE TRUE -> 0 [] OTHER -> -1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01571 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)

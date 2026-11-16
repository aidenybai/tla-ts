(*---
description: Evaluates a random function expression, seed 262, number 4285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b6746 \in {b6747 \in {x \in 1..3 : x > 1} : {1, 2}} : (3 = 1))] EXCEPT !.a = @ + [[[[x \in Nat |-> x + 1] EXCEPT ![-1] = 1] EXCEPT !.a = <<7, 3>>] EXCEPT !.a = Len(SortSeq(<<>>, LAMBDA p, q : p < q))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04285 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form {e1, ... ,eN}.
    line 14, col 119 to line 14, col 124 of module random_04285
---*)

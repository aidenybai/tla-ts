(*---
description: Evaluates a random set expression, seed 262, number 8039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b12407 \in (2 .. -1) : (TRUE => FALSE)), b |-> (\E b12408 \in IF {1, 2} THEN 2 ELSE 7 : (2 = 7))] EXCEPT !.a = ((Head(<<1, 2>>) % (-2147483647)) % (CHOOSE b12409 \in {b12410 \in {} : <<1, 2>>} : ([a |-> 1] = [a |-> 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08039 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 69 of module random_08039
---*)

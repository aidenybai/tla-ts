(*---
description: Evaluates a random function expression, seed 262, number 8625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13358 \in UNION {{LET b13359 == 2147483647 IN b13359, Head(<<3, 1, 2>>)}, UNION {{-1, 7}, DOMAIN (1 :> 2)}} : (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b13358] <=> (FALSE <=> TRUE)) \/ Tail([<<1>> EXCEPT ![1] = 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08625 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 133 to line 14, col 200 of module random_08625
---*)

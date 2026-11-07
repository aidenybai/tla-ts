(*---
description: Evaluates a random record expression, seed 262, number 2003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ([a |-> 1]).a, b |-> (FALSE <=> TRUE)] EXCEPT !.a = ([b3171 \in 2..1 |-> -1])[(2147483647 - 7)]] EXCEPT !.a = (CHOOSE b3172 \in (((1 :> 2))[1] .. ([a |-> 1]).a) : (LET b3173 == 2 IN b3172 < (2 + b3172)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02003 failed.
    In applying the function
    <<>>,
    the first argument is:
    2147483640
    which is not in its domain.
---*)

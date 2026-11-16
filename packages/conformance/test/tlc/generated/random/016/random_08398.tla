(*---
description: Evaluates a random record expression, seed 262, number 8398.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08398 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b12995 \in DOMAIN ((1 :> 2) @@ (1 :> 2)) : (Head(<<1>>) = (3 % b12995))), b |-> (\E b12996 \in {b12997 \in (7 .. 2) : ([a |-> 1] = [a |-> 1])} : ([[a |-> 1] EXCEPT !.a = 7] = [[a |-> 1] EXCEPT !.a = @ + [x \in Nat |-> x + 1]]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08398 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 101 of module random_08398
---*)

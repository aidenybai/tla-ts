(*---
description: Evaluates a random record expression, seed 262, number 2682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b4241 \in (1 .. 0) : (TRUE /\ TRUE)), b |-> (LET b4242 == 2147483647 IN b4242 = (<<5, 6>>)[2])] EXCEPT !.a = ((CHOOSE b4243 \in (1 \cap Nat) : (b4243 :> b4243)) % Head(Append([a |-> 1, b |-> TRUE], 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02682 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 66 of module random_02682
---*)

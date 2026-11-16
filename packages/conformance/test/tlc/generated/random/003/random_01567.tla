(*---
description: Evaluates a random record expression, seed 262, number 1567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b2504 \in {(CHOOSE b2505 \in 2..1 : TRUE), (<<5, 6>>)[1]} : ((CHOOSE b2506 \in Nat : TRUE) :> IF FALSE THEN b2504 ELSE 2)), b |-> ((CHOOSE r \in [a : 1..2] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + (-1 - 2147483647)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01567 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 43 to line 14, col 70 of module random_01567
---*)

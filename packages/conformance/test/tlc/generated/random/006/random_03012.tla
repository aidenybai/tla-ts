(*---
description: Evaluates a random record expression, seed 262, number 3012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b4786 \in ((7 + 3) .. (7 % 2)) : ((b4786 < b4786) => (TRUE => TRUE))), b |-> (((-1 * <<1>>) \in {b4787 \in {} : TRUE}) \/ ((CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE) @@ [(1 :> 2) EXCEPT ![2] = 0]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03012 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 98 of module random_03012
---*)

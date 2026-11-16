(*---
description: Evaluates a random set expression, seed 262, number 1055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1687 \in (((CHOOSE b1688 \in 2..1 : FALSE) + Append(<<1, 2>>, 7)) .. (-(CHOOSE b1689 \in {1, 2} : TRUE))) : (((-1 - b1687) - Head(<<>>)) = ([[x \in Nat |-> x + 1] EXCEPT ![b1687] = b1687])[([a |-> 1, b |-> TRUE]).a])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01055 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 58 of module random_01055
---*)

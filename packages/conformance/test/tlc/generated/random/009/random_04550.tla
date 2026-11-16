(*---
description: Evaluates a random bool expression, seed 262, number 4550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((CHOOSE b7135 \in SUBSET {1} : TRUE) + (CHOOSE r \in [a : 2..1] : TRUE)), ([[a |-> 1] EXCEPT !.a = @ + TRUE]).a>> = ((Len(<<>>) + Head(<<>>)) :> ((1 + 3) % LET b7136 == 7 IN 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04550 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 89 of module random_04550
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 3533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(<<(CHOOSE b5585 \in SUBSET {1} : FALSE), (1 - 7)>> \o [b5586 \in (7 .. 1) |-> (2 :> 3)]) EXCEPT ![1] = (([(1 :> 2) EXCEPT ![7] = 3] @@ (FALSE @@ <<5, 6>>)))[(Len(<<1, 2>>) + CASE FALSE -> {} [] OTHER -> 2)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03533 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 55 of module random_03533
---*)

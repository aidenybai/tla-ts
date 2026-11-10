(*---
description: Evaluates a random set expression, seed 262, number 8067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + Cardinality({b12467 \in {} : TRUE})] EXCEPT !.a = (Cardinality((Nat \cap 1..3)) .. ((-1 * 1) * CASE <<5, 6>> -> 1 [] OTHER -> -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08067 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 168 to line 14, col 175 of module random_08067
---*)

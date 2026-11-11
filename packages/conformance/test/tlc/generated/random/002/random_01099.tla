(*---
description: Evaluates a random function expression, seed 262, number 1099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<5, 6>> EXCEPT ![-1] = 1] @@ [<<1>> EXCEPT ![1] = -1]) @@ (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)) @@ [(CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(([a |-> 1] \o <<>>) \div (CHOOSE b1753 \in {x \in 1..3 : x > 1} : TRUE))] = {(-7), Len(<<3, 1, 2>>)}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_01099
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01099 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> 1]
---*)

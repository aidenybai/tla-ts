(*---
description: Evaluates a random bool expression, seed 262, number 5298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8203 \in (DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = 2] \ DOMAIN (-1 :> 2147483647)) : (\A b8204 \in (DOMAIN <<5, 6>> \cap ({1, 2} \ {})) : (~({1, 2} = 2..1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 56 of module random_05298
    | TRUE
---*)

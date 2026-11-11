(*---
description: Evaluates a random record expression, seed 262, number 8588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE b13305 \in {0, 3} : ({} \subseteq {x \in 1..3 : x > 1})) - ([<<5, 6>> EXCEPT ![-1] = 7])[Len(<<1>>)]) EXCEPT !.a = (((3 + 7)).a - (((1 :> 2) @@ [x \in Nat |-> x + 1]))[(-7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 87 to line 14, col 94 of module random_08588
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08588 failed.
    Attempted to apply EXCEPT construct to the value -5.
---*)

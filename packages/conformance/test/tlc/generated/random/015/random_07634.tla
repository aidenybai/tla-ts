(*---
description: Evaluates a random function expression, seed 262, number 7634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11745 \in {(((1 :> 2) @@ [x \in 1..2 |-> x]) => SelectSeq(b11746, LAMBDA e : e > 0)) : b11746 \in DOMAIN [b11747 \in 3 |-> b11747]} |-> (CHOOSE b11748 \in ({[x \in 1..2 |-> x], b11745} \ (b11745 .. b11745)) : ([[a |-> 1] EXCEPT !.a = @ + 3] = [a |-> 0, b |-> FALSE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07634 failed.
    TLC encountered a non-enumerable quantifier bound
    3.
    line 14, col 116 to line 14, col 147 of module random_07634
---*)

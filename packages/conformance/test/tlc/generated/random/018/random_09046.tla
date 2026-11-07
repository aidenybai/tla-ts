(*---
description: Evaluates a random function expression, seed 262, number 9046.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09046 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ([[a |-> 1] EXCEPT !.a = @ + <<>>] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) -> CASE (<<1>> = [x \in 1..2 |-> x]) -> LET b14052 == 1 IN b14051 [] OTHER -> (-b14051) [] OTHER -> (((1 :> 2))[b14051] * LET b14053 == 7 IN b14051) : b14051 \in DOMAIN (([x \in 1..2 |-> x])[1] .. Len(2))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    2
    2283:0 The argument of Len should be a sequence, but instead it is:
    2
---*)

(*---
description: Evaluates a random record expression, seed 262, number 3231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + (CHOOSE b5131 \in Nat : FALSE)] EXCEPT !.a = (IF TRUE THEN -1 ELSE 3 % Head(<<1, 2>>))] EXCEPT !.a = @ + CASE ((~FALSE) => (<<3, 1, 2>> = (1 :> 2))) -> (CHOOSE b5132 \in ({} \ {1, 2}) : ({1, 2} = SUBSET {1})) [] OTHER -> IF (TRUE <=> FALSE) THEN {b5133 \in Nat : TRUE} ELSE CASE TRUE -> 3 [] OTHER -> 0])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03231 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 81 to line 14, col 108 of module random_03231
---*)

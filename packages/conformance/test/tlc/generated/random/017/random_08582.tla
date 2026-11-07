(*---
description: Evaluates a random set expression, seed 262, number 8582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13293 \in [([(1 :> 2) EXCEPT ![3] = 3] @@ (TRUE @@ (1 :> 2))) EXCEPT ![CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> LET b13294 == 1 IN 2 [] OTHER -> ([a |-> 1]).a] = (CHOOSE b13295 \in (Nat \cap {2, 1, 3}) : (FALSE <=> FALSE))] : (([[a |-> 1] EXCEPT !.a = 0] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]) <=> ((b13293 .. 2147483647) = (Nat \cap {2, 1, 3})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 32 to line 14, col 37 of module random_08582
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
---*)

(*---
description: Evaluates a random int expression, seed 262, number 2029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~SubSeq(<<3, 2>>, LET b3219 == 0 IN 7, ([a |-> 1]).a)) -> (CHOOSE b3220 \in UNION {(Nat \ {}), {3 : b3221 \in {x \in 1..3 : x > 1}}} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b3220] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647])) [] OTHER -> ([[a |-> 0, b |-> TRUE] EXCEPT !.a = (<<5, 6>>)[2147483647]]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02029 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 22 to line 14, col 74 of module random_02029
---*)

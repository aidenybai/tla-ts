(*---
description: Evaluates a random record expression, seed 262, number 3354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (\A b5328 \in (1..3 \cap {x \in 1..3 : x > 1}) : (TRUE => FALSE)) THEN ((2147483647 \div 7) % (3 % 1)) ELSE (CHOOSE b5329 \in UNION {1..3, {1, 2}} : (<<3, 1, 2>> = <<5, 6>>)), b |-> ((Len(<<1, 2>>) * CASE FALSE -> {1, 2} [] OTHER -> 1) \in (CASE FALSE -> 2147483647 [] OTHER -> 7 .. [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03354 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 135 to line 14, col 198 of module random_03354
---*)

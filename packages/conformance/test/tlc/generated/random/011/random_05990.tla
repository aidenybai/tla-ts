(*---
description: Evaluates a random set expression, seed 262, number 5990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(2147483647 :> 2147483647) EXCEPT ![(CHOOSE b9229 \in {x \in 1..3 : x > 1} : TRUE)] = (2147483647 % 0)])[(CHOOSE b9230 \in (2..1 \ {x \in 1..3 : x > 1}) : (3 < 1))] .. [b9231 \in {b9232 \in UNION {{x \in 1..3 : x > 1}, SUBSET {1}} : CASE FALSE -> 7 [] OTHER -> 0} |-> ((-b9231) + Len(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 43 of module random_05990
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05990 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 125 to line 14, col 180 of module random_05990
---*)

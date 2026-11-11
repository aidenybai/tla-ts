(*---
description: Evaluates a random int expression, seed 262, number 6560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) => [a |-> IF TRUE THEN 2 ELSE 0, b |-> (7 = 7)]) -> (((-0) % (2 \div 7)) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a) [] OTHER -> (CHOOSE b10080 \in {(b10081 % 2) : b10081 \in {b10082 \in {} : FALSE}} : (Head(<<1>>) < Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06560 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 22 to line 14, col 115 of module random_06560
---*)

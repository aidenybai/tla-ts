(*---
description: Evaluates a random bool expression, seed 262, number 6958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[b10645 \in 2..1 |-> <<5, 6>>] EXCEPT ![LET b10646 == 2147483647 IN b10646] = IF FALSE THEN -1 ELSE 0] EXCEPT ![(CHOOSE b10647 \in UNION {{2, 1, 3}, {}} : (TRUE \/ TRUE))] = [(CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE) EXCEPT ![(2147483647 % 2)] = (-0)]] \/ (Append(SubSeq(<<3, 1, 2>>, 7, 0), Len(<<3, 1, 2>>)) = ([[x \in 1..2 |-> x] EXCEPT ![1] = 2147483647] @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 48 of module random_06958
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 120 of module random_06958
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06958 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 17 to line 14, col 438 of module random_06958
---*)

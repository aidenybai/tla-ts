(*---
description: Evaluates a random bool expression, seed 262, number 6650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SelectSeq(<<2, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) = [(CHOOSE f \in [{1, 2} -> 1..2] : TRUE) EXCEPT ![(CASE (1 :> 2) -> 7 [] OTHER -> 2 % ([a |-> 1, b |-> TRUE]).a)] = ((2147483647 - 0) - Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06650 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 143 to line 14, col 148 of module random_06650
---*)

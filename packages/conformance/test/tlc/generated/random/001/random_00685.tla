(*---
description: Evaluates a random bool expression, seed 262, number 685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b1146 \in DOMAIN (1 :> 2) : (\A b1147 \in {1} : FALSE)} + Cardinality({b1148 : b1148 \in Nat})) = (LET b1149 == Cardinality({}) IN (2 + 7) * (-LET b1150 == 3 IN b1150))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00685 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 108 to line 14, col 110 of module random_00685
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 1853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((\A b2927 \in Nat : TRUE) /\ (2147483647 < 0))) /\ ((({1} = 1..3) = {2, 2147483647}) => ((<<3, 1, 2>> \o <<>>) = ((1 :> 2) @@ [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01853 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 34 to line 14, col 36 of module random_01853
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

(*---
description: Evaluates a random int expression, seed 262, number 2151.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02151 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((\A b3399 \in Nat : TRUE) \/ (\A b3400 \in Nat : b3400))) /\ (\A b3401 \in (({1, 2} \ {x \in 1..3 : x > 1}) \cap {b3402 : b3402 \in {x \in 1..3 : x > 1}}) : [a |-> (2147483647 % 3), b |-> (TRUE /\ <<1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02151 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 34 to line 14, col 36 of module random_02151
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

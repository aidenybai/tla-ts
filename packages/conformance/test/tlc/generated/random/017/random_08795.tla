(*---
description: Evaluates a random record expression, seed 262, number 8795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((~(~FALSE)) \/ ((\E b13630 \in Nat : TRUE) /\ (\E b13631 \in {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08795 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 50 to line 14, col 52 of module random_08795
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

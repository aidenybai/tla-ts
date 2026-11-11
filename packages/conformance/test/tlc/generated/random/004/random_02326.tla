(*---
description: Evaluates a random bool expression, seed 262, number 2326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((TRUE \/ TRUE) => (\E b3688 \in Nat : FALSE)) => ((FALSE => TRUE) <=> (TRUE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02326 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 52 to line 14, col 54 of module random_02326
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

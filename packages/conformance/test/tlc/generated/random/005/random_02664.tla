(*---
description: Evaluates a random seq expression, seed 262, number 2664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq({b4203 \in {b4204 \in {[a |-> 1] : b4205 \in Nat} : (FALSE <=> FALSE)} : (({1} \subseteq Nat) <=> (\E b4206 \in {1, 2} : FALSE))}, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02664 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 69 to line 14, col 71 of module random_02664
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

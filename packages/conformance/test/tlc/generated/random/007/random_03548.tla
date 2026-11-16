(*---
description: Evaluates a random int expression, seed 262, number 3548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5611 \in {Cardinality({b5612 : b5612 \in Nat}), (Cardinality(2..1) + (-0))} : ((Head(<<3, 1, 2>>) < (7 + -1)) <=> ((b5611 .. b5611) \subseteq ({} \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03548 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 66 to line 14, col 68 of module random_03548
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

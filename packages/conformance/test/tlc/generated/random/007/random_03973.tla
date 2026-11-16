(*---
description: Evaluates a random int expression, seed 262, number 3973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append([Tail(<<1, 2>>) EXCEPT ![1] = (-1 - 1)], Cardinality({b6247 : b6247 \in Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03973 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 100 to line 14, col 102 of module random_03973
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

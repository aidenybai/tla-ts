(*---
description: Evaluates a random int expression, seed 262, number 9623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE r \in [a : 1..2] : TRUE) = [a |-> (-2147483647), b |-> (\A b14945 \in Nat : TRUE)]) -> ([[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = (-0)]).a [] OTHER -> Tail(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), Head(<<1>>), IF FALSE THEN 7 ELSE 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09623 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 100 to line 14, col 102 of module random_09623
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

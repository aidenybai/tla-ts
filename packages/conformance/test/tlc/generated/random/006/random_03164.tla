(*---
description: Evaluates a random bool expression, seed 262, number 3164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) EXCEPT ![1] = CASE (\E b5044 \in Nat : FALSE) -> {b5045 \in {} : TRUE} [] OTHER -> LET b5046 == 1 IN [a |-> 1]] \o [SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = (CASE TRUE -> 2 [] OTHER -> 1 + Len(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03164 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 96 to line 14, col 98 of module random_03164
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

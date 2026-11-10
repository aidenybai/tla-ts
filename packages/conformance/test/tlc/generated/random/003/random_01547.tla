(*---
description: Evaluates a random seq expression, seed 262, number 1547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq([<<0, 2>> EXCEPT ![1] = (-1 * 3)], ((2 % 7) \div LET b2462 == -1 IN 3), (CHOOSE b2463 \in {b2464 : b2464 \in Nat} : (TRUE => FALSE))) \o [SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) EXCEPT ![1] = Len((<<>> \o <<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01547 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 133 to line 14, col 135 of module random_01547
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

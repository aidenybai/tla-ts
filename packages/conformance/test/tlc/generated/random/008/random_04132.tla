(*---
description: Evaluates a random function expression, seed 262, number 4132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail(<<7, 7>>)) :> CASE (~(\A b6500 \in Nat : TRUE)) -> IF (\E b6501 \in {x \in 1..3 : x > 1} : TRUE) THEN Len(<<1>>) ELSE LET b6502 == -1 IN b6502 [] OTHER -> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04132 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 61 to line 14, col 63 of module random_04132
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

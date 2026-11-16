(*---
description: Evaluates a random function expression, seed 262, number 6611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((\A b10142 \in Nat : Nat) => (TRUE \/ 2..1)) -> Head(Tail(<<3, 1, 2>>)) [] OTHER -> (((1 :> 2))[2147483647] + Cardinality(2..1)) :> (-(Head(<<1>>) * CASE [x \in 1..2 |-> x] -> 1 [] OTHER -> 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06611 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 38 to line 14, col 40 of module random_06611
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

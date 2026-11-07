(*---
description: Evaluates a random bool expression, seed 262, number 5776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 .. -1) \subseteq {-1, 3}) => (\E b8900 \in DOMAIN [x \in Nat |-> x + 1] : (FALSE => FALSE))) => (\E b8901 \in {CASE TRUE -> 2147483647 [] OTHER -> 2147483647, (CHOOSE b8902 \in {x \in 1..3 : x > 1} : FALSE)} : [b8903 \in (0 .. 3) |-> CASE FALSE -> 1 [] OTHER -> <<3, 1, 2>>])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05776 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 65 to line 14, col 92 of module random_05776
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

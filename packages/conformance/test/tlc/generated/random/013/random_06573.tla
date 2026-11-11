(*---
description: Evaluates a random int expression, seed 262, number 6573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10095 \in ({(2 + 3), (1 * 0)} \cap {((1 :> 2))[[x \in 1..2 |-> x]] : b10096 \in DOMAIN [x \in Nat |-> x + 1]}) : ((\E b10097 \in DOMAIN (1 :> 2) : (<<5, 6>> \/ FALSE)) <=> ((~FALSE) /\ (3 = -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06573 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 105 to line 14, col 132 of module random_06573
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

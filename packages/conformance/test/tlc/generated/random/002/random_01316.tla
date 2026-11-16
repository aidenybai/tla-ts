(*---
description: Evaluates a random int expression, seed 262, number 1316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b2096 \in {b2097 \in 1..3 : FALSE} : DOMAIN (1 :> 2)) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a [] OTHER -> Cardinality({b2098 : b2098 \in Nat}) * Cardinality(((2..1 \cup SUBSET {1}) \cup {3, -1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01316 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 169 to line 14, col 171 of module random_01316
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

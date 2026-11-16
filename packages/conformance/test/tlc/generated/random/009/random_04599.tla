(*---
description: Evaluates a random set expression, seed 262, number 4599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {((Nat \cup Nat) \cap {b7205 : b7205 \in Nat}), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a}, {((CHOOSE r \in [a : {}] : TRUE)).a : b7206 \in [((1 :> 2) @@ [x \in 1..2 |-> x]) EXCEPT ![Cardinality({1, 2})] = (7 - 0)]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04599 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 70 to line 14, col 72 of module random_04599
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

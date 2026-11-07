(*---
description: Evaluates a random int expression, seed 262, number 378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({CASE FALSE -> 2147483647 [] OTHER -> b623 : b623 \in DOMAIN [x \in Nat |-> x + 1]}) % ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = @ + CASE FALSE -> 1 [] OTHER -> 2]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00378 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 83 to line 14, col 110 of module random_00378
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

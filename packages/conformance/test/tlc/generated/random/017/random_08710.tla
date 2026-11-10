(*---
description: Evaluates a random bool expression, seed 262, number 8710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(DOMAIN [x \in 1..2 |-> x]) .. Head(Tail(<<3, 1, 2>>))) \subseteq UNION {{(2 * {1, 2}) : b13489 \in (Nat \cup 2..1)}, DOMAIN [b13490 \in SUBSET {1} |-> b13490]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08710 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 130 to line 14, col 142 of module random_08710
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

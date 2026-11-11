(*---
description: Evaluates a random bool expression, seed 262, number 8788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b13618 \in {<<1>> : b13619 \in Nat} |-> (b13618 * b13618)] \cap (UNION {{3, FALSE}, (1..3 \cap 2..1)} \cup {(CHOOSE b13621 \in 1..3 : FALSE) : b13620 \in (1..3 \cup {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08788 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 56 to line 14, col 58 of module random_08788
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

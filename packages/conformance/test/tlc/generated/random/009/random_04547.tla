(*---
description: Evaluates a random bool expression, seed 262, number 4547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~({b7129 \in {b7130 : b7130 \in Nat} : (~TRUE)} = (({1, 2} \cup {x \in 1..3 : x > 1}) \cup (2 % 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04547 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 49 to line 14, col 51 of module random_04547
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

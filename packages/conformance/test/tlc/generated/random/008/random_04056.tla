(*---
description: Evaluates a random record expression, seed 262, number 4056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a, b |-> (({b6384 : b6384 \in Nat} \cup {3, -1}) \subseteq DOMAIN [b6385 \in 1..3 |-> 2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04056 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 99 to line 14, col 101 of module random_04056
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

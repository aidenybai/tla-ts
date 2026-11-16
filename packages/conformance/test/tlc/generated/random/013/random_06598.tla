(*---
description: Evaluates a random set expression, seed 262, number 6598.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06598 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Cardinality({1}) : b10126 \in DOMAIN [x \in Nat |-> x + 1]} \cap (DOMAIN [x \in 1..2 |-> x] \ {b10127 \in 2..1 : FALSE})) \cup ((IF TRUE THEN 2 ELSE <<5, 6>> - ((1 :> 2))[0]) .. LET b10128 == (-1) IN (<<5, 6>>)[7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06598 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 49 to line 14, col 76 of module random_06598
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

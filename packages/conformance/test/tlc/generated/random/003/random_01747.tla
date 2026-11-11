(*---
description: Evaluates a random set expression, seed 262, number 1747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{IF TRUE THEN 7 ELSE 0, ([a |-> 1]).a}, ((CHOOSE r \in [a : {1, 2}] : TRUE) \cup {b2774 \in {x \in 1..3 : x > 1} : FALSE})} \cup (UNION {{3 : b2775 \in {1}}, {b2776 : b2776 \in Nat}} \cap DOMAIN [b2777 \in {2, 1, 3} |-> -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01747 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 201 to line 14, col 203 of module random_01747
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

(*---
description: Evaluates a random record expression, seed 262, number 5690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-Cardinality({1})), b |-> (~(\A b8769 \in Nat : <<>>))] EXCEPT !.a = Cardinality((({2, 1, 3} \cup {1, 2}) \cap ({} \cap {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05690 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 67 to line 14, col 69 of module random_05690
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

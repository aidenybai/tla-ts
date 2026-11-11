(*---
description: Evaluates a random set expression, seed 262, number 9517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 + 1) % (2147483647 - 2)) .. ([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 7])[(7 \div 7)]) \cup (((\A b14783 \in Nat : TRUE) /\ (\A b14784 \in 2..1 : FALSE)) \cap (({2, 1, 3} \cup {2, 1, 3}) \ (SUBSET {1} \ {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 53 to line 14, col 70 of module random_09517
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09517 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 134 to line 14, col 136 of module random_09517
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

(*---
description: Evaluates a random function expression, seed 262, number 3237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) @@ (CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE)) @@ [b5142 \in ({b5143 : b5143 \in Nat} \cap {7, 0}) |-> (CHOOSE b5144 \in {b5145 \in SUBSET {1} : TRUE} : (FALSE => FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03237 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 151 to line 14, col 153 of module random_03237
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

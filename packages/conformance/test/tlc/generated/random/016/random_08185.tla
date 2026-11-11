(*---
description: Evaluates a random bool expression, seed 262, number 8185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12657 \in ({b12658 \in {b12659 : b12659 \in Nat} : (TRUE <=> FALSE)} \cap ((1..3 \ {x \in 1..3 : x > 1}) \ ({2, 1, 3} \cap SUBSET {1}))) : ((({1} \ {2, 1, 3}) \subseteq (2..1 \ {2, 1, 3})) => (~([a |-> 1] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08185 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 65 to line 14, col 67 of module random_08185
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

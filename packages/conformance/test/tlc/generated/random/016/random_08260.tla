(*---
description: Evaluates a random bool expression, seed 262, number 8260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12791 \in (Cardinality({2147483647 : b12792 \in Nat}) .. ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a) : ((\E b12793 \in (SUBSET {1} \ {x \in 1..3 : x > 1}) : (b12791 < 0)) /\ (\E b12794 \in ({} \ {2, 1, 3}) : (2147483647 < b12791)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08260 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 69 to line 14, col 71 of module random_08260
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

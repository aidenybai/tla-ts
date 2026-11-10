(*---
description: Evaluates a random bool expression, seed 262, number 1378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b2197 \in (({1 : b2198 \in Nat} \cup (1..3 \cup Nat)) \cup ({1 : b2199 \in {2, 1, 3}} \ {b2200 \in SUBSET {1} : TRUE})) : (([a |-> b2197, b |-> TRUE] = [[a |-> 1] EXCEPT !.a = @ + b2197]) /\ ((\E b2201 \in {1} : FALSE) <=> (7 \in {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01378 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 47 to line 14, col 49 of module random_01378
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

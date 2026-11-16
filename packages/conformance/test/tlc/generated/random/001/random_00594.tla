(*---
description: Evaluates a random function expression, seed 262, number 594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b993 \in ({7 : b994 \in Nat} \cap UNION {SUBSET {1}, 1..3}) |-> (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[Cardinality(1..3)]] @@ ((([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) @@ (2 :> 2147483647)) @@ [b995 \in (Nat \cap SUBSET {1}) |-> Len(<<3, 1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00594 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 42 to line 14, col 44 of module random_00594
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

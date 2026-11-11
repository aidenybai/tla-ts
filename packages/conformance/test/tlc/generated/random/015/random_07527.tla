(*---
description: Evaluates a random bool expression, seed 262, number 7527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b11598 \in {b11599 \in {1} : TRUE} : (<<1>> = <<5, 6>>)} \ DOMAIN [(1 :> 2) EXCEPT ![7] = 2]) \subseteq UNION {({3 : b11600 \in Nat} \cup DOMAIN [x \in 1..2 |-> x]), Append(([x \in Nat |-> x + 1] \ Nat), ([a |-> 1, b |-> TRUE]).a)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 87 to line 14, col 92 of module random_07527
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07527 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 147 to line 14, col 149 of module random_07527
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

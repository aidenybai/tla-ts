(*---
description: Evaluates a random int expression, seed 262, number 1538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(UNION {UNION {({1} \cap {1, 2}), (7 .. 2147483647)}, {Cardinality(2..1) : b2444 \in DOMAIN [x \in Nat |-> x + 1]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01538 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 112 to line 14, col 139 of module random_01538
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

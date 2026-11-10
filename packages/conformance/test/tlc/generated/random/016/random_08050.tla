(*---
description: Evaluates a random int expression, seed 262, number 8050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) : b12430 \in DOMAIN [b12431 \in Nat |-> b12431]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08050 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 87 to line 14, col 120 of module random_08050
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

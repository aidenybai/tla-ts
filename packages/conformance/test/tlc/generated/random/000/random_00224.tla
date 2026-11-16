(*---
description: Evaluates a random int expression, seed 262, number 224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b365 \in {b366 : b366 \in {1}} : (\E b367 \in Nat : FALSE)) \div Head([<<1, 2>> EXCEPT ![1] = -1])) \div (CASE (\E b368 \in 2..1 : TRUE) -> (1 - 3) [] OTHER -> Len(<<3, 1, 2>>) - Cardinality({b369 \in SUBSET {1} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00224 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 72 to line 14, col 74 of module random_00224
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

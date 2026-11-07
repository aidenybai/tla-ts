(*---
description: Evaluates a random int expression, seed 262, number 3709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (\E b5861 \in Nat : TRUE) -> (2147483647 + 1) [] OTHER -> (CHOOSE b5862 \in SUBSET {1} : TRUE), b |-> ({2147483647, 0} = SelectSeq(<<>>, LAMBDA e : e > 0))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03709 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 43 to line 14, col 45 of module random_03709
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

(*---
description: Evaluates a random set expression, seed 262, number 192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({<<b311, b311>> : b311 \in {0 : b312 \in Nat}} \cap ((2147483647 .. 7) \cap {b313 : b313 \in {1}})) \cup (SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = ((-1 - 0) :> ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00192 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 59 to line 14, col 61 of module random_00192
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

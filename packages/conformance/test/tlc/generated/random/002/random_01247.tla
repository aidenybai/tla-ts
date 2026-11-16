(*---
description: Evaluates a random function expression, seed 262, number 1247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE) EXCEPT ![(Cardinality({b1997 : b1997 \in Nat}) * (((1 :> 2) @@ [x \in Nat |-> x + 1]))[SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)])] = Cardinality({Head(<<3, 1, 2>>) : b1998 \in (0 .. 0)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01247 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 99 to line 14, col 101 of module random_01247
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

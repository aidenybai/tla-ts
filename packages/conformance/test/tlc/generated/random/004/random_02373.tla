(*---
description: Evaluates a random bool expression, seed 262, number 2373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<1, 2>> = [x \in 1..2 |-> x]) /\ ({1} \subseteq {1})) => ({1 : b3756 \in Nat} = {b3757 \in 1..3 : FALSE})) <=> (Cardinality(SubSeq(<<1, 2>>, -1, TRUE)) = (LET b3758 == 2147483647 IN 1 * (CHOOSE b3759 \in 2..1 : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02373 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 94 to line 14, col 96 of module random_02373
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

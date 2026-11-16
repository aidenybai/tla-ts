(*---
description: Evaluates a random function expression, seed 262, number 8498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13159 \in UNION {{b13160 \in {b13161 : b13161 \in Nat} : ([x \in 1..2 |-> x] /\ TRUE)}, DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x])} |-> ((Len(<<>>) \div (0 * b13159)) \div SortSeq((<<3, 1, 2>> \o <<1>>), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08498 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 68 to line 14, col 70 of module random_08498
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

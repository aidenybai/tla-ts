(*---
description: Evaluates a random function expression, seed 262, number 4705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b7356 \in {b7357 \in {2 : b7358 \in 2..1} : (FALSE => FALSE)} |-> Cardinality({3 : b7359 \in SUBSET {1}})] EXCEPT ![(CASE ({x \in 1..3 : x > 1} = {2, 1, 3}) -> Head(<<1>>) [] OTHER -> {b7360 : b7360 \in Nat} \div ((2147483647 + 2) % (FALSE \/ FALSE)))] = CASE (Head(<<1, 2>>) < Head(<<3, 1, 2>>)) -> ((3 \div 7) % (CHOOSE b7361 \in {1, 2} : FALSE)) [] OTHER -> (-IF TRUE THEN 7 ELSE <<>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04705 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 221 to line 14, col 223 of module random_04705
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

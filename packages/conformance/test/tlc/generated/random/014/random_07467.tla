(*---
description: Evaluates a random record expression, seed 262, number 7467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (3 % 7), b |-> (TRUE <=> TRUE)] EXCEPT !.a = @ + (CHOOSE b11507 \in {2 : b11508 \in Nat} : (<<1>> = (1 :> 2)))] EXCEPT !.a = (CASE (FALSE => TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> IF TRUE THEN 2147483647 ELSE 0 % ((3 % TRUE) - ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07467 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 109 to line 14, col 111 of module random_07467
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

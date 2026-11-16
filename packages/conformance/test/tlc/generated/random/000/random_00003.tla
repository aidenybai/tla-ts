(*---
description: Evaluates a random bool expression, seed 262, number 3.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 - 2147483647) \in {b4 : b4 \in Nat}) /\ [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = @ + ([a |-> 1]).a]) <=> ((\E b5 \in ({1, 2} \ {2, 1, 3}) : (7 < b5)) \/ (IF TRUE THEN 2147483647 ELSE 3 < (-1 + 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00003 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 53 to line 14, col 55 of module random_00003
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

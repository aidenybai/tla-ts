(*---
description: Evaluates a random set expression, seed 262, number 2068.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02068 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ((1..3 = {1, 2}) \/ (\E b3291 \in Nat : TRUE)) THEN {b3292 \in (2..1 \ {2, 1, 3}) : (\E b3293 \in {1, 2} : FALSE)} ELSE (IF TRUE THEN -1 ELSE 7 \div IF TRUE THEN -1 ELSE 3), ([[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = IF FALSE THEN -1 ELSE 3] % ([[a |-> 1] EXCEPT !.a = @ + 2] + (3 + 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02068 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 54 to line 14, col 56 of module random_02068
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

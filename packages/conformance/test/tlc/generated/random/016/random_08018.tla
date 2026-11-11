(*---
description: Evaluates a random record expression, seed 262, number 8018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = IF TRUE THEN 0 ELSE 1] EXCEPT !.a = (Cardinality({1}) - Head(<<1, 2>>))] \cap {Cardinality((b12367 .. 7)) : b12367 \in {CASE TRUE -> -1 [] OTHER -> 0 : b12368 \in {b12369 : b12369 \in Nat}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08018 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 248 to line 14, col 250 of module random_08018
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

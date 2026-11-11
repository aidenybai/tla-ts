(*---
description: Evaluates a random seq expression, seed 262, number 6907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((7 + 2) - (2 * 2)) \in {b10573 \in DOMAIN [x \in 1..2 |-> x] : ({1, 2} = {1, 2})}), (Cardinality({b10574 \in {x \in 1..3 : x > 1} : TRUE}) \div IF (\E b10575 \in Nat : TRUE) THEN (2 * 7) ELSE (1 + 1))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06907 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 182 to line 14, col 184 of module random_06907
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

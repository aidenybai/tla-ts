(*---
description: Evaluates a random set expression, seed 262, number 8624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((DOMAIN [x \in 1..2 |-> x] \ {b13356 : b13356 \in Nat})), (((1 \div 7))[LET b13357 == FALSE IN b13357] * Cardinality(DOMAIN [a |-> 1]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08624 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 79 to line 14, col 81 of module random_08624
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

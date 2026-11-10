(*---
description: Evaluates a random int expression, seed 262, number 1615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((\A b2575 \in DOMAIN [x \in Nat |-> x + 1] : ({1, 2} \subseteq SUBSET {1})) => ([[a |-> 1] EXCEPT !.a = 3] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))) -> Len(((<<>> \o [a |-> 1, b |-> TRUE]) \o [<<>> EXCEPT ![1] = 2147483647])) [] OTHER -> ((\A b2576 \in ({x \in 1..3 : x > 1} \cup Nat) : (b2576 + -1)) - (Len(<<3, 1, 2>>) - (-1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01615 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 36 to line 14, col 63 of module random_01615
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

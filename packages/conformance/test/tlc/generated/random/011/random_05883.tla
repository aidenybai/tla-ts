(*---
description: Evaluates a random int expression, seed 262, number 5883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9076 \in {Head(<<1>>) : b9077 \in DOMAIN [x \in Nat |-> x + 1]} |-> Len((<<1, 2>> \o <<>>))])[(-(CHOOSE b9078 \in UNION {{2, 1, 3}, {2, 1, 3}} : (FALSE => TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05883 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 53 to line 14, col 80 of module random_05883
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

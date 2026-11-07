(*---
description: Evaluates a random int expression, seed 262, number 501.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00501 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b828 \in {(7 - 3) : b829 \in {b830 : b830 \in Nat}} : (Head(<<1>>) \in DOMAIN [x \in Nat |-> x + 1])) * Head(<<Head(<<1, 2>>), LET b831 == -1 IN 2>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00501 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 71 to line 14, col 73 of module random_00501
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

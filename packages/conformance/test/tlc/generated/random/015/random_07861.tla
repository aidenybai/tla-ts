(*---
description: Evaluates a random function expression, seed 262, number 7861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12141 \in (({1, 1} \cup {b12142 : b12142 \in Nat}) \cap UNION {(7 .. -1), {7, 1}}) |-> (((CHOOSE b12143 \in {} : TRUE) \div (b12141 % b12141)) - ((7 :> 2147483647))[(1 \div b12141)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07861 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 63 to line 14, col 65 of module random_07861
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

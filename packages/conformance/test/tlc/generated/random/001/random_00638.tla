(*---
description: Evaluates a random record expression, seed 262, number 638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((\A b1065 \in Nat : TRUE) => ([a |-> 1, b |-> TRUE] = {})) -> (LET b1066 == 2147483647 IN b1066 % (2 - 3)) [] OTHER -> (LET b1067 == <<1, 2>> IN -1 + ([a |-> 1, b |-> TRUE]).a), b |-> ((IF FALSE THEN -1 ELSE -1 * (1 \div 3)) :> ((0 - -1) - ([a |-> 1, b |-> TRUE]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00638 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 43 to line 14, col 45 of module random_00638
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

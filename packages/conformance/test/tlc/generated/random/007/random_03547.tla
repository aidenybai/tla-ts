(*---
description: Evaluates a random function expression, seed 262, number 3547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(({x \in 1..3 : x > 1} \cap Nat)) \div IF (\E b5609 \in {2, 1, 3} : TRUE) THEN (7 * 1) ELSE CASE FALSE -> 7 [] OTHER -> 2147483647) = ((CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE))[((\E b5610 \in Nat : FALSE) % Len(<<>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03547 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 230 to line 14, col 232 of module random_03547
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

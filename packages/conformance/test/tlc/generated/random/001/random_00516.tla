(*---
description: Evaluates a random int expression, seed 262, number 516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\A b870 \in Nat : FALSE) THEN Len(<<1>>) ELSE (-0) % ((-1 * 2147483647) - (-1))) + (CASE (\E b871 \in 2..1 : FALSE) -> Head(<<3, 1, 2>>) [] OTHER -> LET b872 == 0 IN 0 \div Head(SubSeq(<<>>, -1, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00516 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 34 to line 14, col 36 of module random_00516
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

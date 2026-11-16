(*---
description: Evaluates a random set expression, seed 262, number 1757.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01757 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-CASE (\E b2794 \in Nat : TRUE) -> Head(<<>>) [] OTHER -> Cardinality({1})), ((CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE))[Len(Append(<<3, 1, 2>>, 0))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01757 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 38 to line 14, col 40 of module random_01757
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

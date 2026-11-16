(*---
description: Evaluates a random int expression, seed 262, number 7189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b11043 == (({b11044 : b11044 \in Nat} % ([a |-> 1]).a) \div (Cardinality(Nat) + Len(<<>>))) IN ([a |-> LET b11045 == b11043 IN b11045, b |-> (Nat \subseteq {1, 2})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07189 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 53 to line 14, col 55 of module random_07189
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

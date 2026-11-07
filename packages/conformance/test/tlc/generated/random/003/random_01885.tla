(*---
description: Evaluates a random set expression, seed 262, number 1885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-IF TRUE THEN b2964 ELSE 0) : b2964 \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![-1] = 7]} \cup {(CHOOSE b2965 \in (-1 \cap {1}) : (~FALSE)), ((0 % 7) \div ([x \in Nat |-> x + 1])[2147483647])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 67 to line 14, col 87 of module random_01885
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01885 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 59 to line 14, col 105 of module random_01885
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

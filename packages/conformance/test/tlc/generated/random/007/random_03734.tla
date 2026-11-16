(*---
description: Evaluates a random bool expression, seed 262, number 3734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(<<b5897, -1>>) : b5897 \in ((1 \div 2147483647) .. Cardinality(2..1))} \subseteq {CASE (SUBSET {1} \subseteq SUBSET {1}) -> Head([x \in 1..2 |-> x]) [] OTHER -> Head(<<1>>) : b5898 \in DOMAIN [b5899 \in Nat |-> 0]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03734 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 208 to line 14, col 235 of module random_03734
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

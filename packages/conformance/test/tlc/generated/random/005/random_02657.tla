(*---
description: Evaluates a random set expression, seed 262, number 2657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \ 1..3) \cap {7 : b4193 \in Nat}) \cap (CASE FALSE -> 2147483647 [] OTHER -> 0 .. Cardinality(1..3))) \cap (DOMAIN [[a |-> 1] EXCEPT ![<<1>>] = 7] \cap (CASE FALSE -> 2 [] OTHER -> 3 .. Len(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02657 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 51 to line 14, col 53 of module random_02657
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

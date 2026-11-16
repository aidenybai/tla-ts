(*---
description: Evaluates a random set expression, seed 262, number 6240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({(3 - 7), CASE FALSE -> 1 [] OTHER -> 7} \cap ({b9603 : b9603 \in Nat} \ (0 .. 2147483647))), ({b9604 \in (2147483647 .. 1) : (<<1>> = (1 :> 2))} \ {((1 :> 2))[2], (-2)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06240 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 90 to line 14, col 92 of module random_06240
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

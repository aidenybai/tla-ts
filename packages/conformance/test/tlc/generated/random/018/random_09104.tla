(*---
description: Evaluates a random int expression, seed 262, number 9104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14142 == ((CHOOSE b14143 \in {b14144 : b14144 \in Nat} : (<<1>> = (1 :> 2))) * ((CHOOSE f \in [1..2 -> {}] : TRUE))[CASE TRUE -> 1 [] OTHER -> 7]) IN (((-1 - b14142) + IF FALSE THEN b14142 ELSE 7) + (CHOOSE b14145 \in {1, b14142} : DOMAIN (1 :> 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09104 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 71 to line 14, col 73 of module random_09104
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

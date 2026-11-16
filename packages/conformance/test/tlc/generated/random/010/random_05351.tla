(*---
description: Evaluates a random int expression, seed 262, number 5351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b8269 \in {3 : b8270 \in Nat} : (~TRUE)) :> CASE (TRUE \/ TRUE) -> LET b8271 == 7 IN <<3, 1, 2>> [] OTHER -> Len(<<3, 1, 2>>)))[Head(Append(Append(<<1, 2>>, 0), ({1, 2} = Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05351 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 51 to line 14, col 53 of module random_05351
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

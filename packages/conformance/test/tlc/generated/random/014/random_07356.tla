(*---
description: Evaluates a random function expression, seed 262, number 7356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(-1 - 2)) :> Len((<<1>> \o <<1, 2>>))) @@ ((CHOOSE b11318 \in DOMAIN <<5, 6>> : (\A b11319 \in Nat : FALSE)) :> ([(1 :> 2) EXCEPT ![2] = {1, 2}])[Head([x \in Nat |-> x + 1])])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07356 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 115 to line 14, col 117 of module random_07356
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)

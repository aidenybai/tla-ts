(*---
description: Evaluates a random int expression, seed 262, number 3414.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03414 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5417 == (CHOOSE b5418 \in (SubSeq(<<>>, Nat, 0) .. Head(<<>>)) : (Head(<<1>>) = CASE FALSE -> b5418 [] OTHER -> b5418)) IN ((CASE FALSE -> 2147483647 [] OTHER -> b5417 * (-b5417)) - (CHOOSE b5419 \in DOMAIN (1 :> 2) : (\A b5420 \in TRUE : <<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    Nat
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    Nat
---*)

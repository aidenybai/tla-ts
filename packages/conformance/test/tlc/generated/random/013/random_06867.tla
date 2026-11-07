(*---
description: Evaluates a random bool expression, seed 262, number 6867.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06867 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10531 \in {((0 - -1) % LET b10532 == 2147483647 IN 2), Head(Tail(<<1, 2>>))} : (UNION {DOMAIN (1 :> 2), (Nat \cap 2..1)} = UNION {{b10533 \in 2..1 : TRUE}, (b10531 .. 0)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

(*---
description: Evaluates a random function expression, seed 262, number 4351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE FALSE -> -1 [] OTHER -> 3 \div Cardinality(2..1)) - (CHOOSE b6856 \in (0 .. 2) : (Nat \subseteq b6856))) :> [b6857 \in ((-1 % 7) \div Head(<<1>>)) |-> (Len(<<1>>) + (2147483647 - [a |-> 1, b |-> TRUE]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04351 failed.
    2179:0 The second argument of \div is 0.
---*)

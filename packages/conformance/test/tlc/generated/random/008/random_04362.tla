(*---
description: Evaluates a random set expression, seed 262, number 4362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b6876 \in (Head(<<3, 1, 2>>) .. Cardinality(Nat)) |-> ((7 \div 7) % CASE FALSE -> b6876 [] OTHER -> b6876)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04362 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

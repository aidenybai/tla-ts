(*---
description: Evaluates a random int expression, seed 262, number 9058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14080 \in ({(0 % 2147483647), (2 \div 2147483647)} \ (UNION {1..3, 2..1} \cap (2..1 \ SUBSET {1}))) : ((CASE TRUE -> -1 [] OTHER -> 2 + (b14080 + 7)) \in UNION {(b14080 .. b14080), (b14080 .. 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09058 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 220 of module random_09058
---*)

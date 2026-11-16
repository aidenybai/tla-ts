(*---
description: Evaluates a random set expression, seed 262, number 9003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 + 1) .. CASE 2..1 -> 1 [] OTHER -> 1) \ ((3 + 0) .. CASE FALSE -> -1 [] OTHER -> 7)) \cap (({[x \in 1..2 |-> x], 3} \ ([x \in Nat |-> x + 1] \ {})) \cap UNION {{b13985 \in SUBSET {1} : TRUE}, DOMAIN <<5, 6>>})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09003 failed.
    A non-boolean expression (a set of the form i..j) was used as a condition of a CASE. line 14, col 35 to line 14, col 38 of module random_09003
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 6247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (2147483647 % -1) -> (CHOOSE b9620 \in SUBSET {1} : TRUE) [] OTHER -> CASE FALSE -> 2147483647 [] OTHER -> 0, Cardinality({7 : b9621 \in {2, 1, 3}})} = {b9622 \in {b9623 \in UNION {{x \in 1..3 : x > 1}, {1}} : (~TRUE)} : (\A b9624 \in ({} \cup 1..3) : ({} \subseteq 1..3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06247 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

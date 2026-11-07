(*---
description: Evaluates a random bool expression, seed 262, number 1569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \cup {x \in 1..3 : x > 1}) \cup DOMAIN <<3, 1, 2>>) \subseteq ((<<5, 6>>)[0] .. (CHOOSE b2510 \in {1} : FALSE))) \/ (((\A b2511 \in {2, 1, 3} : FALSE) = CASE TRUE -> -1 [] OTHER -> 2147483647) /\ (<<2147483647, 1>> = (-1 + <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01569 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)

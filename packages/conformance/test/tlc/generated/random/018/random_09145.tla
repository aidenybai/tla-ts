(*---
description: Evaluates a random bool expression, seed 262, number 9145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14203 \in {([a |-> 1]).a, LET b14204 == 1 IN b14204} : ((~<<3, 1, 2>>) \/ (FALSE \/ TRUE))) \in {b14205 \in {(<<5, 6>>)[2] : b14206 \in DOMAIN [x \in 1..2 |-> x]} : (Append(<<>>, 0) = [b14207 \in {x \in 1..3 : x > 1} |-> 7])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09145 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 83 to line 14, col 94 of module random_09145
---*)

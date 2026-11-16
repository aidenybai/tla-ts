(*---
description: Evaluates a random set expression, seed 262, number 6241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9605 \in {((3 - 0) - ([x \in 1..2 |-> x])[1]), (([x \in 1..2 |-> x] @@ <<5, 6>>))[IF FALSE THEN 1 ELSE 1]} : ((CASE TRUE -> -1 [] OTHER -> -1 .. (2147483647 + -1)) = {b9606 \in {SUBSET {1} : b9607 \in {2, 1, 3}} : (CHOOSE r \in [a : {1}] : TRUE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06241 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 233 to line 14, col 261 of module random_06241
---*)

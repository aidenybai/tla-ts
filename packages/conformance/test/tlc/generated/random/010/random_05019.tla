(*---
description: Evaluates a random int expression, seed 262, number 5019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7808 \in (UNION {([a |-> 1] \cap {x \in 1..3 : x > 1}), DOMAIN [x \in 1..2 |-> x]} \ {b7809 \in UNION {{2, 1, 3}, {1}} : (\A b7810 \in 1..3 : TRUE)}) : (\E b7811 \in {(b7808 - b7812) : b7812 \in ({x \in 1..3 : x > 1} \ {1})} : (Head(<<1, 2>>) = CASE TRUE -> 3 [] OTHER -> FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05019 failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 1]
---*)

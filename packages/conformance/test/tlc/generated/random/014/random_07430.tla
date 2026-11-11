(*---
description: Evaluates a random seq expression, seed 262, number 7430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b11451 \in (DOMAIN [x \in 1..2 |-> x] \ (FALSE /\ [x \in 1..2 |-> x])) : (\A b11452 \in {1 : b11453 \in {1}} : (-1 \in {x \in 1..3 : x > 1}))), (((-1 * 3) - LET b11454 == 2 IN -1) + CASE (TRUE \/ FALSE) -> (1 \div 2) [] OTHER -> Head(<<1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07430 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)

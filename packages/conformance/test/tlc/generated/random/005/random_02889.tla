(*---
description: Evaluates a random int expression, seed 262, number 2889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ({(1 - 0), ([a |-> 1, b |-> TRUE]).a} \subseteq ([b4574 \in {1} |-> b4574] \cap ({1, 2} \ 2..1))) THEN (((0 * 3) \div ([a |-> 1]).a) % (-(CHOOSE b4575 \in Nat : [x \in 1..2 |-> x]))) ELSE (Cardinality((1..3 \cap {2, 1, 3})) \div (Head(<<>>) * (0 * {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02889 failed.
    Attempted to check if the value:
    1
    is an element of the function <<1>>
---*)

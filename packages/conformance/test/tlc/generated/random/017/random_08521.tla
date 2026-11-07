(*---
description: Evaluates a random int expression, seed 262, number 8521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13201 \in UNION {({1, 2} \ FALSE), (1..3 \ {1, 2})} : ((b13201 % b13201) < (1 * b13201))) \div [(CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![1] = LET b13202 == (CHOOSE b13203 \in Nat : FALSE) IN (-0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08521 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)

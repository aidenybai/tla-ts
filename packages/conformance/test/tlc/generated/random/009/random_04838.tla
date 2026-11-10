(*---
description: Evaluates a random set expression, seed 262, number 4838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {({x \in 1..3 : x > 1} \cup <<5, 6>>), (CHOOSE f \in [{} -> {}] : TRUE)} \cup (UNION {2..1, Nat} \ {b7553 \in {x \in 1..3 : x > 1} : FALSE})) \cup (((7 + 3) .. (2 \in 0)) \cap DOMAIN [b7554 \in {x \in 1..3 : x > 1} |-> b7554])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04838 failed.
    Attempted to check if the value:
    2
    is an element of the integer 0
---*)

(*---
description: Evaluates a random function expression, seed 262, number 8852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13713 \in {((7 + [a |-> 1]) + ([x \in Nat |-> x + 1])[-1]) : b13714 \in UNION {DOMAIN [x \in Nat |-> x + 1], DOMAIN <<5, 6>>}} |-> ((CHOOSE b13715 \in ({1, 2} \ Nat) : (Nat \subseteq 1..3)) + (-Len(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08852 failed.
    Attempted to compare the set {1, 2} with the value:
    Nat
---*)

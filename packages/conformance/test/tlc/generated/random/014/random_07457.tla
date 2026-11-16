(*---
description: Evaluates a random bool expression, seed 262, number 7457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b11496 \in {CASE FALSE -> 3 [] OTHER -> 1, LET b11497 == 3 IN 1} : (CASE TRUE -> b11496 [] OTHER -> b11496 < Cardinality({}))} \subseteq (((<<1>> \o <<3, 1, 2>>) \ ({x \in 1..3 : x > 1} \ <<1>>)) \cup (({x \in 1..3 : x > 1} \ Nat) \cup ({2, 1, 3} \cap Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07457 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 86 to line 14, col 141 of module random_07457
---*)

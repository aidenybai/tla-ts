(*---
description: Evaluates a random function expression, seed 262, number 1138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1821 \in {CASE (\A b1823 \in 2..1 : TRUE) -> CASE FALSE -> b1822 [] OTHER -> 0 [] OTHER -> (-0) : b1822 \in {b1824 \in ({2, 1, 3} \cap 1..3) : (<<>> = <<5, 6>>)}} |-> Cardinality({b1825 \in (Nat \cup {x \in 1..3 : x > 1}) : (1 \in {1, 2})})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

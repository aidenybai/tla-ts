(*---
description: Evaluates a random set expression, seed 262, number 3990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({1} \ 2..1) \cup DOMAIN [x \in 1..2 |-> x]) \cup UNION {DOMAIN [x \in 1..2 |-> x], ({1, 2} \cap {x \in 1..3 : x > 1})}), ((CASE TRUE -> 3 [] OTHER -> -1 + (7 + 1)) .. CASE (<<>> = <<5, 6>>) -> Len(<<3, 1, 2>>) [] OTHER -> Len(<<>>))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)

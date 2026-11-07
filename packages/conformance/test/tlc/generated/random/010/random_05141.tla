(*---
description: Evaluates a random set expression, seed 262, number 5141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Head(Tail(<<>>)) % CASE (3 \in TRUE) -> LET b7983 == b7982 IN 2 [] OTHER -> LET b7984 == 2147483647 IN <<1, 2>>) : b7982 \in ({b7985 \in {b7986 \in {x \in 1..3 : x > 1} : FALSE} : (\E b7987 \in [a |-> 1] : TRUE)} \cap DOMAIN (CHOOSE f \in [{1} -> {1}] : TRUE))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

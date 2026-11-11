(*---
description: Evaluates a random bool expression, seed 262, number 843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [b1378 \in 2..1 |-> b1378] \cup (UNION {{1, 2}, {x \in 1..3 : x > 1}} \cap DOMAIN <<5, 6>>)) = {([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a, Len((<<3, 1, 2>> \o <<1, 2>>))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

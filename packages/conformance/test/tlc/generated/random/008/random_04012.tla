(*---
description: Evaluates a random set expression, seed 262, number 4012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len((<<>> \o <<1>>)) % Cardinality(({2, 1, 3} \cup 2..1))), (CHOOSE b6299 \in DOMAIN (<<5, 6>> @@ <<5, 6>>) : (([a |-> 1, b |-> TRUE]).a \in ({1} \cup {2, 1, 3})))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)

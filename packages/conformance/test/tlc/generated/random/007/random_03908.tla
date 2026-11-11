(*---
description: Evaluates a random function expression, seed 262, number 3908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6157 \in UNION {{b6158 \in (1..3 \ 1..3) : (<<>> = -1)}, (DOMAIN (1 :> 2) \cap ({2, 1, 3} \cup {}))} |-> (([[a |-> 1] EXCEPT !.a = b6157]).a \div ([a |-> b6157, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)

(*---
description: Evaluates a random int expression, seed 262, number 7815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12061 \in ({b12062 \in (2..1 \cup SUBSET {1}) : ({1, 2} \subseteq 1..3)} \ {(7 - 7), CASE FALSE -> 0 [] OTHER -> 3}) |-> (CHOOSE b12063 \in {(b12061 - b12061), (b12061 \div b12061)} : (([a |-> 1] = [a |-> 1, b |-> TRUE]) \/ (~TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b12061 \\in {{}, {1}} \\ {0, 3} |-> <expression line 14, col 140 to line 14, col 249 of module random_07815>]"
---*)

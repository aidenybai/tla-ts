(*---
description: Evaluates a random record expression, seed 262, number 7982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> {b12330 \in ((1..3 \cup {1, 2}) \cup {2, 7}) : ({b12330, 7} \subseteq UNION {{}, {1}})}, b |-> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a = Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> {}, b |-> FALSE]"
---*)

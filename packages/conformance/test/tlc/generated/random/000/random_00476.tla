(*---
description: Evaluates a random set expression, seed 262, number 476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b788 \in (({2, 1, 3} \cup SUBSET {1}) \cap ({x \in 1..3 : x > 1} \cup {1})) : (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) <=> (TRUE \/ TRUE))) .. IF ((TRUE <=> TRUE) => (3 = 2147483647)) THEN ((1..3 \ {x \in 1..3 : x > 1}))[([a |-> 1, b |-> TRUE]).a] ELSE Head((<<1>> \o <<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00476 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 104 to line 14, col 163 of module random_00476
---*)

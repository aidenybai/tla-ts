(*---
description: Evaluates a random seq expression, seed 262, number 9976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = Cardinality({x \in 1..3 : x > 1})] EXCEPT !.a = (([a |-> 1, b |-> TRUE]).a % IF FALSE THEN TRUE ELSE 2)] EXCEPT ![1] = IF (\A b15514 \in ({x \in 1..3 : x > 1} \cap {1}) : (TRUE <=> FALSE)) THEN CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Head(<<>>) [] OTHER -> (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) ELSE (CHOOSE b15515 \in {2, 2147483647} : (-1 = b15515))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09976 failed.
    Attempted to access record by a non-string argument: 1
---*)

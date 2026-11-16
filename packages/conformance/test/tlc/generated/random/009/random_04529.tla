(*---
description: Evaluates a random function expression, seed 262, number 4529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0], b |-> (\A b7113 \in {x \in 1..3 : x > 1} : FALSE)] EXCEPT ![(Len(<<1, 2>>) \div Len(<<1>>))] = CASE SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) -> CASE TRUE -> 2 [] OTHER -> 1 [] OTHER -> Cardinality({})] EXCEPT ![CASE (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) <=> ({2, 1, 3} = {2, 1, 3})) -> IF (\E b7114 \in -1 : TRUE) THEN Cardinality({1}) ELSE Head(<<3, 1, 2>>) [] OTHER -> ((CHOOSE b7115 \in {} : FALSE) + CASE FALSE -> 1 [] OTHER -> [x \in 1..2 |-> x])] = (((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a % CASE (<<3, 1, 2>> = [x \in 1..2 |-> x]) -> (2 * 0) [] OTHER -> CASE TRUE -> 1 [] OTHER -> 2)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04529 failed.
    Attempted to access record by a non-string argument: 2
---*)

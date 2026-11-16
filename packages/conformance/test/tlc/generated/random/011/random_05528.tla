(*---
description: Evaluates a random seq expression, seed 262, number 5528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<([2147483647 EXCEPT !.a = -1])[Len(<<3, 1, 2>>)], (-CASE [x \in Nat |-> x + 1] -> 1 [] OTHER -> 3)>>, ((([a |-> 1]).a \div (-1 + {2, 1, 3})) \div (Cardinality({x \in 1..3 : x > 1}) % IF FALSE THEN 2147483647 ELSE 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05528 failed.
    Attempted to apply EXCEPT construct to the value 2147483647.
---*)

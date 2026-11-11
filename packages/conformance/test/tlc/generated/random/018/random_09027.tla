(*---
description: Evaluates a random function expression, seed 262, number 9027.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b14021 \in ([[a |-> 1] EXCEPT !.a = 2147483647] \cap DOMAIN (1 :> 2)) |-> ((-1 % b14021) \div (2 - 1))] EXCEPT ![(-CASE (2 < 2) -> ({1} \div 1) [] OTHER -> Head(<<1, 2>>))] = (Cardinality({b14022 \in {2, 1, 3} : 7}) * LET b14023 == ([x \in 1..2 |-> x])[7] IN LET b14024 == 3 IN 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09027 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 2147483647]
---*)

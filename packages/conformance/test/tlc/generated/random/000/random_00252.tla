(*---
description: Evaluates a random function expression, seed 262, number 252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) EXCEPT ![CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> IF TRUE THEN 7 ELSE 2147483647 [] OTHER -> (2 \div 2147483647)] = LET b420 == (-2) IN IF [a |-> 1, b |-> TRUE] THEN 2147483647 ELSE b420] EXCEPT ![LET b421 == (CHOOSE b422 \in {-1, 2147483647} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) IN ([b423 \in {x \in 1..3 : x > 1} |-> b423])[(CHOOSE b424 \in {1} : TRUE)]] = (((0 % 1) % (2147483647 * 1)) - ((CHOOSE b425 \in {x \in 1..3 : x > 1} : TRUE) < Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00252 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 201 to line 14, col 250 of module random_00252
---*)

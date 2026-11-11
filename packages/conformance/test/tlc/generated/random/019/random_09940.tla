(*---
description: Evaluates a random function expression, seed 262, number 9940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b15463 \in {(b15464 :> 7) : b15464 \in ([a |-> 1]).a} |-> (CASE TRUE -> <<1, 2>> [] OTHER -> 0 * Len(<<3, 1, 2>>))] EXCEPT ![((IF FALSE THEN 2147483647 ELSE 3 - (2 * 1)) * (IF FALSE THEN 0 ELSE 1 \in {2147483647, -1}))] = ([b15465 \in ({1, 2} \cup SUBSET {1}) |-> (2 % b15465)])[([b15466 \in 2..1 |-> b15466])[Len(<<3, 1, 2>>)]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09940 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 57 to line 14, col 69 of module random_09940
---*)

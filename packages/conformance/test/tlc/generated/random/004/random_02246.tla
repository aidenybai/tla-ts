(*---
description: Evaluates a random int expression, seed 262, number 2246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Append(Tail(<<3, 1, 2>>), IF FALSE THEN 3 ELSE 2147483647)), b |-> ([a |-> Head(<<3, 1, 2>>), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])] = [a |-> (3 \div 3), b |-> (<<1>> = (1 :> 2))])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3, b |-> FALSE]"
---*)

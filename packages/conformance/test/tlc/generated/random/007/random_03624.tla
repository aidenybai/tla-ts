(*---
description: Evaluates a random record expression, seed 262, number 3624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b5726 == CASE FALSE -> 7 [] OTHER -> [x \in Nat |-> x + 1] IN Head(<<>>), b |-> ((3 + 3) <=> (FALSE => FALSE))] EXCEPT !.a = IF (Append(<<1, 2>>, 2) = (1 :> 7)) THEN Len(Tail(<<>>)) ELSE ((-[x \in Nat |-> x + 1]) \div [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03624 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

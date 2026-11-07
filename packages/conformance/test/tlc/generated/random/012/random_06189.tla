(*---
description: Evaluates a random function expression, seed 262, number 6189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(Append(<<1, 2>>, 7), LAMBDA p, q : p < q) :> ((2147483647 + 3) - LET b9526 == 3 IN [x \in Nat |-> x + 1])) @@ [(<<1, 2147483647>> @@ (1 :> -1)) EXCEPT ![([<<5, 6>> EXCEPT ![7] = 2147483647])[<<-1, 1>>]] = IF ({1} = {2, 1, 3}) THEN LET b9527 == 0 IN b9527 ELSE ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+3
    2178:0 Overflow when computing 2147483647+3
---*)

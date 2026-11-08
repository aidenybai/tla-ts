(*---
description: Evaluates a random seq expression, seed 262, number 4766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([[Append(<<1, 2>>, -1) EXCEPT ![1] = [a |-> 1, b |-> TRUE]] EXCEPT ![1] = LET b7445 == Head(<<1>>) IN LET b7446 == b7445 IN [a |-> 1]], ((CASE FALSE -> 1 [] OTHER -> 1 - Len(<<1, 2>>)) - (Tail(<<3, 1, 2>>) @@ [[x \in Nat |-> x + 1] EXCEPT ![<<1>>] = 3])), (((<<5, 6>>)[7] \div [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]) % (-CASE TRUE -> 3 [] OTHER -> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04766 failed.
    2158:0 Attempted to check if the value:
    <<1>>
    is an element of Nat.
---*)

(*---
description: Evaluates a random record expression, seed 262, number 6508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([[x \in Nat |-> x + 1] EXCEPT ![3] = {2, 1, 3}])[(-1 + 1)], b |-> ([[a |-> 1] EXCEPT !.a = @ + 2147483647] = [a |-> 1, b |-> FALSE])] EXCEPT !.a = @ + CASE ({b10005 \in SUBSET {1} : FALSE} = {2, 1}) -> SubSeq(<<-1, 7>>, IF FALSE THEN 2 ELSE 1, (7 * 1)) [] OTHER -> Head((CHOOSE r \in [a : 2..1] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06508 failed.
    2178:0 Overflow when computing 1+2147483647
---*)

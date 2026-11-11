(*---
description: Evaluates a random int expression, seed 262, number 2040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~([[a |-> 1] EXCEPT !.a = @ + 2147483647] = [[x \in Nat |-> x + 1] EXCEPT ![1] = -1])) -> (Head((<<3, 1, 2>> \o <<1>>)) % (Len(<<>>) - LET b3240 == 3 IN b3240)) [] OTHER -> (CHOOSE b3241 \in {([a |-> 1, b |-> TRUE]).a : b3242 \in (2 .. 1)} : (\A b3243 \in (2..1 \ SUBSET {1}) : (\E b3244 \in 2..1 : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02040 failed.
    2178:0 Overflow when computing 1+2147483647
---*)

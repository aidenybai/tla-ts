(*---
description: Evaluates a random function expression, seed 262, number 2815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [1..2 -> {1, 2}] : TRUE) @@ (2 :> 1)) EXCEPT ![(-Cardinality({x \in 1..3 : x > 1}))] = (-(7 - 2))] @@ [[[[x \in Nat |-> x + 1] EXCEPT ![7] = 2147483647] EXCEPT ![IF FALSE THEN 3 ELSE 1] = IF TRUE THEN Nat ELSE 3] EXCEPT ![([b4469 \in {2, 1, 3} |-> b4469])[Len(<<>>)]] = Len((<<1>> \o <<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 68 of module random_02815
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02815 failed.
    In applying the function
    <<1, 2, 3>>,
    the first argument is:
    0
    which is not in its domain.
---*)

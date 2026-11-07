(*---
description: Evaluates a random function expression, seed 262, number 5011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b7795 \in DOMAIN [x \in 1..2 |-> x] : CASE TRUE -> 0 [] OTHER -> b7795) % {([a |-> 1, b |-> TRUE]).a, LET b7796 == 7 IN [a |-> 1]}), b |-> (((~FALSE) => (\A b7797 \in Nat : FALSE)) => ((~TRUE) /\ ({1, 2} = {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 25 to line 14, col 101 of module random_05011
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 25 to line 14, col 101 of module random_05011
---*)

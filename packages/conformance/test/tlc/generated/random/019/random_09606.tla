(*---
description: Evaluates a random bool expression, seed 262, number 9606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-2147483647) % (7 % -1)) + CASE ({1, 2} = {x \in 1..3 : x > 1}) -> [a |-> [a |-> 1], b |-> TRUE] [] OTHER -> (3 \div 7)) = (LET b14914 == ((1 :> 2))[3] IN Head(<<1, 2>>) % LET b14915 == (-7) IN CASE FALSE -> b14915 [] OTHER -> b14915)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09606 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

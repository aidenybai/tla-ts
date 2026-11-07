(*---
description: Evaluates a random int expression, seed 262, number 4241.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04241 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((TRUE => TRUE) => SubSeq(<<1>>, -1, 3)) \/ ((Nat \cup SUBSET {1}) \subseteq (2147483647 .. 2))) -> LET b6671 == (([a |-> 1, b |-> TRUE]).a \div (0 * [x \in Nat |-> x + 1])) IN (-(7 - 7)) [] OTHER -> IF (DOMAIN [a |-> 1, b |-> TRUE] \subseteq UNION {{}, {x \in 1..3 : x > 1}}) THEN ([[x \in 1..2 |-> x] EXCEPT ![2] = -1])[(2 * 2147483647)] ELSE ((1 \div <<3, 1, 2>>) - IF FALSE THEN 7 ELSE 2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)

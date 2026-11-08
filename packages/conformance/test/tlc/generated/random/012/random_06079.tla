(*---
description: Evaluates a random seq expression, seed 262, number 6079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail([<<1, 1>> EXCEPT ![1] = (2 * 3)]), (CASE (TRUE => TRUE) -> IF FALSE THEN 0 ELSE -1 [] OTHER -> (7 \div 2147483647) % (([x \in 1..2 |-> x])[3] - LET b9363 == 0 IN b9363)), ((CHOOSE r \in [a : 1..2] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06079 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)

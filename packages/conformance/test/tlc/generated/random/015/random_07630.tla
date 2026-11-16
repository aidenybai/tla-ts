(*---
description: Evaluates a random seq expression, seed 262, number 7630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(Append(<<2147483647, 1>>, ([x \in 1..2 |-> x])[0]), Len([<<1>> EXCEPT ![1] = 7]), CASE ({} \subseteq {1}) -> IF TRUE THEN 3 ELSE 7 [] OTHER -> Append(<<1>>, 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07630 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)

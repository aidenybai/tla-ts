(*---
description: Evaluates a random seq expression, seed 262, number 5577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SubSeq(Tail(<<1>>), IF TRUE THEN 2147483647 ELSE 2147483647, (2 * 2)), Head((<<3, 1, 2>> \o <<1, 2>>)), CASE (<<5, 6>> \in {1}) -> Head(<<1, 2>>) [] OTHER -> [[a |-> 1] EXCEPT !.a = @ + 2]), Cardinality({LET b8635 == 3 IN b8635, (0 - 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05577 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<5, 6>>
---*)

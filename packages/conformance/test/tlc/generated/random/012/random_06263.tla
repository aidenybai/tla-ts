(*---
description: Evaluates a random record expression, seed 262, number 6263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((3 .. -1)).a * (IF TRUE THEN 3 ELSE 0 * CASE FALSE -> -1 [] OTHER -> 2)), b |-> Tail(SubSeq(Append(<<>>, 7), IF TRUE THEN 2 ELSE 7, <<-1, 7>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06263 failed.
    Attempted to select field "a" from a non-record value {}
    line 14, col 24 to line 14, col 36 of module random_06263
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 3808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SelectSeq((<<1, 2>> \o <<>>), LAMBDA e : e > 0) \o Append(SubSeq(<<1>>, -1, 2147483647), (-7))), ([b6004 \in UNION {{1, 2}, -1} |-> LET b6005 == 7 IN 7])[CASE (TRUE /\ FALSE) -> (-1 + 1) [] OTHER -> (2147483647 \div 0)]))
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

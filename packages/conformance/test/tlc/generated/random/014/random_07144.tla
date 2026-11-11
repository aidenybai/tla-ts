(*---
description: Evaluates a random seq expression, seed 262, number 7144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SubSeq(Append(<<>>, 2), (2 * 1), Head(<<1>>)), Head(SubSeq(<<>>, 0, 7))) EXCEPT ![1] = ((UNION {{}, SUBSET {1}} \cup (1..3 \cap 2..1)))[(LET b10972 == <<1, 2>> IN b10972 \div (0 + 2147483647))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07144 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)

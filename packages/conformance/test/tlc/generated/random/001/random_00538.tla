(*---
description: Evaluates a random set expression, seed 262, number 538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (-b909), CASE FALSE -> 2 [] OTHER -> b909)) : b909 \in {IF (2..1 \subseteq b910) THEN ([a |-> 1]).a ELSE IF FALSE THEN b910 ELSE b910 : b910 \in (({1} \cup {1}) \ {b911 \in {2, 1, 3} : FALSE})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00538 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)

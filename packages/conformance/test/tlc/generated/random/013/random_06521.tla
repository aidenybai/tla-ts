(*---
description: Evaluates a random bool expression, seed 262, number 6521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Append(<<3, 1, 2>>, 0)) = Head((<<1>> \o <<1, 2>>))) => ({Head(<<>>), (2 * 0)} \subseteq UNION {(1..3 \ {2, 1, 3}), {b10021 : b10021 \in <<5, 6>>}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

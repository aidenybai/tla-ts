(*---
description: Evaluates a random set expression, seed 262, number 8256.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08256 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((b12779 - b12779) :> (b12779 % 3)))[((-1 - 3) \div (<<>> \o <<>>))] : b12779 \in (({b12780 \in {1} : FALSE} \ ({1, 2} \cap {})) \cup {(b12781 + 1) : b12781 \in {b12782 \in 2..1 : FALSE}})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

(*---
description: Evaluates a random function expression, seed 262, number 2921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4615 \in {b4616 \in (Len(<<>>) :> (2147483647 \div 3)) : ((FALSE => FALSE) <=> (2 < 3))} |-> Cardinality(DOMAIN [b4617 \in SUBSET {1} |-> 3])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b4615 \\in {b4616 \\in (0 :> 715827882) : <expression line 14, col 76 to line 14, col 103 of module random_02921> } |-> <expression line 14, col 111 to line 14, col 158 of module random_02921>]"
---*)

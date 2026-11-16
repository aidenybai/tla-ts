(*---
description: Evaluates a random bool expression, seed 262, number 9618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14934 \in (DOMAIN [b14935 \in {1, 2} |-> 3] \ ({1, 0} \cup ({x \in 1..3 : x > 1} \cap 1..3))) : (\A b14936 \in {((1 :> 2) .. b14934), Len(<<3, 1, 2>>)} : ((b14936 + b14934) < (CHOOSE r \in [a : {}] : TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

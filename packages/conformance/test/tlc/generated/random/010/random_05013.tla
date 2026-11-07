(*---
description: Evaluates a random record expression, seed 262, number 5013.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05013 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b7799 == ((-0) * IF TRUE THEN 1 ELSE [a |-> 1]) IN (Len(<<1, 2>>) % (--1)), b |-> (\E b7800 \in (({x \in 1..3 : x > 1} \cup SUBSET {1}) \ (2147483647 .. 1)) : ((~FALSE) \/ (~TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 98 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 95.
    | ExtendableExpr starting at line 14, column 79.
    | Expression starting at line 14, column 79.
    | ExtendableExpr starting at line 14, column 78.
    | Expression starting at line 14, column 78.
    | Fatal errors while parsing TLA+ spec in file random_05013
    | In module random_05013
    | Could not parse module random_05013 from file random_05013.tla
    | *** Errors: 1
    | In module random_05013
    | Could not parse module random_05013 from file random_05013.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 2463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((--1) .. ((1 :> 2))[3]) \subseteq ({b3880 : b3880 \in {2, 1, 3}} \cup (SUBSET {1} \cup {1}))) \/ (<<([a |-> 1, b |-> TRUE]).a, Len(<<1>>)>> = ([b3881 \in {1} |-> -1] @@ (-1 + -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 22 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_02463
    | In module random_02463
    | Could not parse module random_02463 from file random_02463.tla
    | *** Errors: 1
    | In module random_02463
    | Could not parse module random_02463 from file random_02463.tla
    3002:1 Parsing or semantic analysis failed.
---*)

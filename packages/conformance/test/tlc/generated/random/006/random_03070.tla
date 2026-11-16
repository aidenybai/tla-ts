(*---
description: Evaluates a random int expression, seed 262, number 3070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b4868 \in {b4869 \in ((2 - -1) .. (--1)) : ((b4869 - b4869) = LET b4870 == 1 IN 3)} : ({b4871 \in ({2, 1, 3} \cup 2..1) : (<<1>> = [x \in 1..2 |-> x])} = UNION {({1, 2} \cup {1}), (SUBSET {1} \ {1})})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 61 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 58.
    | ExtendableExpr starting at line 14, column 46.
    | Expression starting at line 14, column 46.
    | ExtendableExpr starting at line 14, column 45.
    | Expression starting at line 14, column 45.
    | Fatal errors while parsing TLA+ spec in file random_03070
    | In module random_03070
    | Could not parse module random_03070 from file random_03070.tla
    | *** Errors: 1
    | In module random_03070
    | Could not parse module random_03070 from file random_03070.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Evaluates a random set expression, seed 262, number 3848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6061 \in {(1 \div 2147483647), (-1 \div [x \in 1..2 |-> x])} : ((--1) = Len(<<1>>))} \cap ((CHOOSE b6062 \in UNION {2..1, 1..3} : (FALSE /\ FALSE)) + (Head(<<>>) + ({1, 2} + 0)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 86 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | ExtendableExpr starting at line 14, column 82.
    | Expression starting at line 14, column 82.
    | Some { } form starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_03848
    | In module random_03848
    | Could not parse module random_03848 from file random_03848.tla
    | *** Errors: 1
    | In module random_03848
    | Could not parse module random_03848 from file random_03848.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 9267.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09267 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b14383 \in UNION {{(-7), Cardinality({2, 1, 3})}, ((--1) .. (1 + 3))} : ([b14384 \in {3 : b14385 \in {2, 1, 3}} |-> Len(<<3, 1, 2>>)] \/ ((<<1>> = (1 :> 2)) \/ [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b14383]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 74 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | Some { } form starting at line 14, column 37.
    | Fatal errors while parsing TLA+ spec in file random_09267
    | In module random_09267
    | Could not parse module random_09267 from file random_09267.tla
    | *** Errors: 1
    | In module random_09267
    | Could not parse module random_09267 from file random_09267.tla
    3002:1 Parsing or semantic analysis failed.
---*)

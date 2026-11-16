(*---
description: Evaluates a random set expression, seed 262, number 3495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(2 \div 2147483647), (CHOOSE b5521 \in 2..1 : TRUE)>>) .. (IF (\A b5522 \in <<1, 2>> : TRUE) THEN [a |-> 2, b |-> TRUE] ELSE ([x \in Nat |-> x + 1])[(1 :> 2)] * <<[a |-> 3, b |-> FALSE], (--1)>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 213 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 210.
    | Expression starting at line 14, column 210.
    | Some << -- >> or >>_ Form starting at line 14, column 184.
    | ExtendableExpr starting at line 14, column 184.
    | ExtendableExpr starting at line 14, column 148.
    | Fatal errors while parsing TLA+ spec in file random_03495
    | In module random_03495
    | Could not parse module random_03495 from file random_03495.tla
    | *** Errors: 1
    | In module random_03495
    | Could not parse module random_03495 from file random_03495.tla
    3002:1 Parsing or semantic analysis failed.
---*)

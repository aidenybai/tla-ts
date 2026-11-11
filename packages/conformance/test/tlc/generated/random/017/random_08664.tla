(*---
description: Evaluates a random seq expression, seed 262, number 8664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<[(7 \in 2..1) EXCEPT ![Cardinality(2..1)] = ([a |-> 1, b |-> TRUE]).a], ([[a |-> 1] EXCEPT !.a = @ + 2]).a>> EXCEPT ![1] = [[a |-> (3 + -1), b |-> ({} = [a |-> 1])] EXCEPT !.a = (IF TRUE THEN 0 ELSE 2 \div (--1))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 228 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 225.
    | ExtendableExpr starting at line 14, column 218.
    | Expression starting at line 14, column 218.
    | IF THEN ELSE starting at line 14, column 198.
    | Expression starting at line 14, column 198.
    | Fatal errors while parsing TLA+ spec in file random_08664
    | In module random_08664
    | Could not parse module random_08664 from file random_08664.tla
    | *** Errors: 1
    | In module random_08664
    | Could not parse module random_08664 from file random_08664.tla
    3002:1 Parsing or semantic analysis failed.
---*)

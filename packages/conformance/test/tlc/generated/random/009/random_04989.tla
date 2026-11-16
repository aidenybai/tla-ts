(*---
description: Evaluates a random seq expression, seed 262, number 4989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<(2..1 \div 3), (TRUE => TRUE)>> EXCEPT ![1] = (Head(<<>>) :> (--1))] \o SortSeq((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o Append(<<>>, [a |-> 1, b |-> TRUE])), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 84 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 81.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | Fatal errors while parsing TLA+ spec in file random_04989
    | In module random_04989
    | Could not parse module random_04989 from file random_04989.tla
    | *** Errors: 1
    | In module random_04989
    | Could not parse module random_04989 from file random_04989.tla
    3002:1 Parsing or semantic analysis failed.
---*)

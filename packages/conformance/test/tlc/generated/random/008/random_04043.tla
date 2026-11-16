(*---
description: Evaluates a random function expression, seed 262, number 4043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6359 == Head(Append((<<>> \o <<1>>), (--1))) IN ((-(b6359 \div [x \in 1..2 |-> x])) * (Len(<<3, 1, 2>>) + (-1 \div 2))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 61 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | Optional Arguments starting at line 14, column 40.
    | Primitive expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 34.
    | Fatal errors while parsing TLA+ spec in file random_04043
    | In module random_04043
    | Could not parse module random_04043 from file random_04043.tla
    | *** Errors: 1
    | In module random_04043
    | Could not parse module random_04043 from file random_04043.tla
    3002:1 Parsing or semantic analysis failed.
---*)

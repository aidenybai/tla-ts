(*---
description: Evaluates a random seq expression, seed 262, number 355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append((<<1, 2>> \o <<1, 2>>), ([a |-> 1]).a)) \o Append(SortSeq(SubSeq(<<>>, 1, 3), LAMBDA p, q : p < q), IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN (-1 \div 2) ELSE (--1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 205 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | IF THEN ELSE starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | Optional Arguments starting at line 14, column 78.
    | Fatal errors while parsing TLA+ spec in file random_00355
    | In module random_00355
    | Could not parse module random_00355 from file random_00355.tla
    | *** Errors: 1
    | In module random_00355
    | Could not parse module random_00355 from file random_00355.tla
    3002:1 Parsing or semantic analysis failed.
---*)

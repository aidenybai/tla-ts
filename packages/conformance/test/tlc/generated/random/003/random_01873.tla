(*---
description: Evaluates a random function expression, seed 262, number 1873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) * ((--1) - ([a |-> 1, b |-> TRUE]).a)) :> IF ((\E b2949 \in Nat : TRUE) <=> (7 = [x \in 1..2 |-> x])) THEN SelectSeq(SubSeq(<<1>>, -1, 2), LAMBDA e : e > 0) ELSE CASE (<<1, 2>> = [x \in Nat |-> x + 1]) -> ([a |-> 1]).a [] OTHER -> (2 \div 3)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 66 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 63.
    | Expression starting at line 14, column 63.
    | ExtendableExpr starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_01873
    | In module random_01873
    | Could not parse module random_01873 from file random_01873.tla
    | *** Errors: 1
    | In module random_01873
    | Could not parse module random_01873 from file random_01873.tla
    3002:1 Parsing or semantic analysis failed.
---*)

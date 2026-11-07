(*---
description: Evaluates a random bool expression, seed 262, number 8221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \ {1}) \cup (1 .. 2147483647)) \cup UNION {({1} \ Nat), (3 .. 2147483647)}) \subseteq {(IF FALSE THEN [x \in 1..2 |-> x] ELSE 0 - (--1)), ((7 - 2147483647) + CASE TRUE -> 2147483647 [] OTHER -> 0)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 156 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 149.
    | Expression starting at line 14, column 149.
    | IF THEN ELSE starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | Fatal errors while parsing TLA+ spec in file random_08221
    | In module random_08221
    | Could not parse module random_08221 from file random_08221.tla
    | *** Errors: 1
    | In module random_08221
    | Could not parse module random_08221 from file random_08221.tla
    3002:1 Parsing or semantic analysis failed.
---*)
